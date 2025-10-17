"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Smile, Send, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ChatInputProps {
  onSendMessage: (
    content: string,
    messageType?: string,
    attachmentUrl?: string,
  ) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onTyping,
  onStopTyping,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle emoji selection
  const handleEmojiClick = (emojiObject: any) => {
    const newMessage = message + emojiObject.emoji;
    setMessage(newMessage);

    // Focus back to textarea after emoji selection
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for image files only
    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...imageFiles]);

      // Simulate upload progress
      imageFiles.forEach((file) => {
        const fileId = Math.random().toString(36).substr(2, 9);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress >= 100) {
              clearInterval(progressInterval);
              return { ...prev, [fileId]: 100 };
            }
            return { ...prev, [fileId]: currentProgress + 10 };
          });
        }, 100);
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".bmp"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Handle file upload
  const handleAttachment = () => {
    setShowImageUpload(!showImageUpload);
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send image message
  const sendImageMessage = async (file: File) => {
    try {
      // In a real implementation, you would upload the file to a server
      // and get back a URL. For now, we'll create a local URL
      const imageUrl = URL.createObjectURL(file);

      // Send message with image
      await onSendMessage(message || "Shared an image", "image", imageUrl);

      // Clear the message and uploaded files
      setMessage("");
      setUploadedFiles([]);
      setUploadProgress({});
      setShowImageUpload(false);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onStopTyping();
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled) return;

    const messageToSend = message.trim();
    setMessage("");

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onStopTyping();
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send message
    await onSendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmoji = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        {/* Attachment Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleAttachment}
          disabled={disabled}
          className={cn(
            "flex-shrink-0 h-10 w-10",
            showImageUpload && "bg-primary text-primary-foreground",
          )}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[40px] max-h-[120px] resize-none pr-12",
              "focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "border-border bg-background",
            )}
            rows={1}
          />

          {/* Emoji Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEmoji}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={(!message.trim() && uploadedFiles.length === 0) || disabled}
          className="flex-shrink-0 h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Image Upload Area */}
      {showImageUpload && (
        <div
          {...getRootProps()}
          className={cn(
            "mt-2 p-4 border-2 border-dashed rounded-lg transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
          )}
        >
          <input {...getInputProps()} />

          {uploadedFiles.length === 0 ? (
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? "Drop the images here..."
                  : "Drag & drop images here, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: JPEG, PNG, GIF, WebP (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {uploadedFiles.map((file, index) => {
                  const fileId = Math.random().toString(36).substr(2, 9);
                  const progress = uploadProgress[fileId] || 0;
                  const previewUrl = URL.createObjectURL(file);

                  return (
                    <div key={index} className="relative group">
                      <img
                        src={previewUrl}
                        alt={`Preview ${index}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />

                      {/* Progress overlay */}
                      {progress < 100 && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-xs">{progress}%</div>
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Send button when upload is complete */}
                      {progress === 100 && (
                        <button
                          type="button"
                          onClick={() => sendImageMessage(file)}
                          className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Send className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add more images button */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[type="file"]',
                    ) as HTMLInputElement;
                    if (input) {
                      input.click();
                    }
                  }}
                  className="text-xs"
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Add More Images
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full mb-2 right-0 z-50"
        >
          <div className="bg-background border rounded-lg shadow-lg">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={320}
              height={400}
            />
          </div>
        </div>
      )}
    </div>
  );
}
