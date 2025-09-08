import { db } from '@/lib/db';

export interface NotificationData {
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'POST' | 'SYSTEM';
  title: string;
  message: string;
  userId: string;
  actorId?: string;
  postId?: string;
}

export async function createNotification(data: NotificationData) {
  try {
    const notification = await db.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        actorId: data.actorId,
        postId: data.postId
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createLikeNotification(postId: string, likerId: string) {
  try {
    // Get the post and author
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: true
      }
    });

    if (!post || post.authorId === likerId) {
      return; // Don't create notification for own likes
    }

    await createNotification({
      type: 'LIKE',
      title: 'New Like',
      message: `${post.author.name} liked your post "${post.title}"`,
      userId: post.authorId,
      actorId: likerId,
      postId: postId
    });
  } catch (error) {
    console.error('Error creating like notification:', error);
  }
}

export async function createCommentNotification(postId: string, commenterId: string) {
  try {
    // Get the post and author
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: true
      }
    });

    if (!post || post.authorId === commenterId) {
      return; // Don't create notification for own comments
    }

    await createNotification({
      type: 'COMMENT',
      title: 'New Comment',
      message: `${post.author.name} commented on your post "${post.title}"`,
      userId: post.authorId,
      actorId: commenterId,
      postId: postId
    });
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }
}

export async function createFollowNotification(followedId: string, followerId: string) {
  try {
    // Get the follower's name
    const follower = await db.user.findUnique({
      where: { id: followerId },
      select: { name: true }
    });

    if (!follower) {
      return;
    }

    await createNotification({
      type: 'FOLLOW',
      title: 'New Follower',
      message: `${follower.name} started following you`,
      userId: followedId,
      actorId: followerId
    });
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
}