import { Server, Socket } from "socket.io";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  sanitizeMessage,
  shouldBlockMessage,
  isSafeFile,
} from "./chatSecurity";

// Online users tracking
const onlineUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

/**
 * Validate user authentication from socket handshake
 */
async function validateSocketAuth(
  socket: Socket,
): Promise<{ userId: string; username: string } | null> {
  try {
    // Get session from NextAuth (we'll need to implement session extraction from socket)
    // For now, we'll use a simple token-based approach
    const token = socket.handshake.auth.token;

    if (!token) {
      return null;
    }

    // In a real implementation, you'd validate the JWT token here
    // For now, we'll assume the token contains userId
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return null;
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username || user.name || "Unknown", // Prioritize username over name
    };
  } catch (error) {
    console.error("[SocketChat] Auth validation error:", error);
    return null;
  }
}

/**
 * Send chat notification to offline users
 */
async function sendChatNotification(roomId: string, message: any) {
  try {
    // Get room members (except sender)
    const members = await db.chatRoomMember.findMany({
      where: {
        chatRoomId: roomId,
        userId: { not: message.senderId },
      },
      include: {
        user: true,
        chatRoom: {
          include: { community: true },
        },
      },
    });

    for (const member of members) {
      // Check if user is online in this room
      const isOnline = onlineUsers.get(roomId)?.has(member.userId) || false;

      if (!isOnline) {
        // Send notification
        await db.notification.create({
          data: {
            type: "CHAT_MESSAGE",
            title: `${message.sender.name} - ${member.chatRoom.name}`,
            message: message.content.substring(0, 100),
            userId: member.userId,
            actorId: message.senderId,
          },
        });
      }
    }
  } catch (error) {
    console.error("[SocketChat] Error sending notification:", error);
  }
}

/**
 * Setup Chat Socket.IO Namespace
 */
export const setupChatSocket = (io: Server) => {
  const chatNamespace = io.of("/chat");

  // Authentication middleware
  chatNamespace.use(async (socket, next) => {
    const authResult = await validateSocketAuth(socket);

    if (authResult) {
      socket.data.userId = authResult.userId;
      socket.data.username = authResult.username;
      next();
    } else {
      next(new Error("Authentication failed"));
    }
  });

  chatNamespace.on("connection", (socket: Socket) => {
    console.log("[SocketChat] User connected:", socket.data.userId);

    // Join user's chat rooms
    socket.on("join-rooms", async (roomIds: string[]) => {
      try {
        if (!Array.isArray(roomIds)) {
          return;
        }

        // Verify user is member of these rooms
        const userRooms = await db.chatRoomMember.findMany({
          where: {
            userId: socket.data.userId,
            chatRoomId: { in: roomIds },
          },
          select: { chatRoomId: true },
        });

        const validRoomIds = userRooms.map((r) => r.chatRoomId);

        // Join valid rooms
        validRoomIds.forEach((roomId) => {
          socket.join(`room:${roomId}`);

          // Track online status
          if (!onlineUsers.has(roomId)) {
            onlineUsers.set(roomId, new Set());
          }
          onlineUsers.get(roomId)!.add(socket.data.userId);

          // Notify others in room
          socket.to(`room:${roomId}`).emit("user-online", {
            userId: socket.data.userId,
            username: socket.data.username,
            roomId,
          });
        });

        console.log(
          `[SocketChat] User ${socket.data.userId} joined rooms:`,
          validRoomIds,
        );
      } catch (error) {
        console.error("[SocketChat] Error joining rooms:", error);
      }
    });

    // Send message
    socket.on("send-message", async (data) => {
      try {
        const { roomId, content, messageType = "text", attachmentUrl } = data;

        console.log("[SocketChat] Received send-message:", data);

        if (!roomId || !content || content.trim().length === 0) {
          return;
        }

        // Security checks
        const blockCheck = shouldBlockMessage(content, attachmentUrl);
        if (blockCheck.shouldBlock) {
          console.log(
            "[SocketChat] Message blocked for security reasons:",
            blockCheck.reason,
          );
          // Send notification to sender that message was blocked
          socket.emit("message-blocked", {
            reason: blockCheck.reason,
            roomId,
          });
          return;
        }

        // Sanitize message content
        const { sanitizedContent, hasSuspiciousContent, warnings } =
          sanitizeMessage(content);

        // If there were warnings, log them but still send the sanitized message
        if (warnings.length > 0) {
          console.log("[SocketChat] Security warnings for message:", warnings);
        }

        // Verify user is member of this room
        const membership = await db.chatRoomMember.findUnique({
          where: {
            userId_chatRoomId: {
              userId: socket.data.userId,
              chatRoomId: roomId,
            },
          },
        });

        if (!membership) {
          console.log(
            "[SocketChat] User not member of room:",
            socket.data.userId,
            roomId,
          );
          return;
        }

        // Save message to database with sanitized content
        const message = await db.chatMessage.create({
          data: {
            chatRoomId: roomId,
            senderId: socket.data.userId,
            content: sanitizedContent, // Use sanitized content
            messageType,
            attachmentUrl,
          },
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        });

        console.log("[SocketChat] Message saved to database:", message);

        // Broadcast to room - CRITICAL: Real-time mesajlaşma için bu adım çok önemli!
        console.log(`[SocketChat] Broadcasting message to room:${roomId}`);
        console.log(
          `[SocketChat] Current room members:`,
          Array.from(onlineUsers.get(roomId) || new Set()),
        );

        // Include security warnings in the broadcast if any
        const messageWithWarnings = {
          ...message,
          securityWarnings: hasSuspiciousContent ? warnings : undefined,
        };

        chatNamespace
          .to(`room:${roomId}`)
          .emit("new-message", messageWithWarnings);
        console.log(
          `[SocketChat] Message broadcast completed to room:${roomId}`,
        );

        // Send notification to offline members
        sendChatNotification(roomId, messageWithWarnings);

        console.log(
          `[SocketChat] Message sent in room ${roomId} by ${socket.data.userId}`,
        );
      } catch (error) {
        console.error("[SocketChat] Error sending message:", error);
      }
    });

    // Typing indicator - start
    socket.on("typing-start", ({ roomId }) => {
      try {
        if (!roomId) return;

        // Verify user is member
        if (onlineUsers.get(roomId)?.has(socket.data.userId)) {
          socket.to(`room:${roomId}`).emit("user-typing", {
            userId: socket.data.userId,
            username: socket.data.username,
            roomId,
          });
        }
      } catch (error) {
        console.error("[SocketChat] Error handling typing start:", error);
      }
    });

    // Typing indicator - stop
    socket.on("typing-stop", ({ roomId }) => {
      try {
        if (!roomId) return;

        socket.to(`room:${roomId}`).emit("user-stop-typing", {
          userId: socket.data.userId,
          username: socket.data.username, // username bilgisini ekle
          roomId,
        });
      } catch (error) {
        console.error("[SocketChat] Error handling typing stop:", error);
      }
    });

    // Delete message
    socket.on("delete-message", async ({ messageId, roomId }) => {
      try {
        console.log("[SocketChat] Received delete-message:", {
          messageId,
          roomId,
          userId: socket.data.userId,
        });

        if (!messageId || !roomId) return;

        // Verify user is the sender
        const message = await db.chatMessage.findUnique({
          where: { id: messageId },
          select: { senderId: true },
        });

        if (!message || message.senderId !== socket.data.userId) {
          console.log(
            "[SocketChat] User not authorized to delete message:",
            socket.data.userId,
            messageId,
          );
          return;
        }

        // Mark as deleted
        await db.chatMessage.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        console.log("[SocketChat] Message marked as deleted:", messageId);

        // Broadcast deletion
        chatNamespace
          .to(`room:${roomId}`)
          .emit("message-deleted", { messageId });

        console.log(
          `[SocketChat] Message ${messageId} deletion broadcast to room ${roomId}`,
        );
      } catch (error) {
        console.error("[SocketChat] Error deleting message:", error);
      }
    });

    // Get online users in room
    socket.on("get-online-users", ({ roomId }) => {
      try {
        if (!roomId) return;

        const onlineInRoom = onlineUsers.get(roomId) || new Set();
        const onlineUserIds = Array.from(onlineInRoom);

        socket.emit("online-users-list", {
          roomId,
          userIds: onlineUserIds,
        });
      } catch (error) {
        console.error("[SocketChat] Error getting online users:", error);
      }
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      console.log("[SocketChat] User disconnected:", socket.data.userId);

      // Remove from all online tracking
      for (const [roomId, userSet] of onlineUsers.entries()) {
        if (userSet.has(socket.data.userId)) {
          userSet.delete(socket.data.userId);

          // Notify others in room
          socket.to(`room:${roomId}`).emit("user-offline", {
            userId: socket.data.userId,
            roomId,
          });

          // Clean up empty sets
          if (userSet.size === 0) {
            onlineUsers.delete(roomId);
          }
        }
      }
    });
  });

  console.log("[SocketChat] Chat namespace setup complete");
};
