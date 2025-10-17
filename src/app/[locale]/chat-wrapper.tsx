"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { useState, useEffect } from "react";

// ChatPanel wrapper component to handle state
export function ChatPanelWrapper() {
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(400); // Default width
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);

  // Global event listener for toggling chat panel
  useEffect(() => {
    const handleToggleChatPanel = () => {
      setChatPanelOpen((prev) => !prev);
    };

    window.addEventListener("toggle-chat-panel", handleToggleChatPanel);

    return () => {
      window.removeEventListener("toggle-chat-panel", handleToggleChatPanel);
    };
  }, []);

  // Update main content padding when chat panel state changes
  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      if (chatPanelOpen && !chatPanelCollapsed) {
        mainContent.style.paddingLeft = `${chatPanelWidth}px`;
      } else {
        mainContent.style.paddingLeft = "50px"; // Collapsed width
      }
    }
  }, [chatPanelOpen, chatPanelWidth, chatPanelCollapsed]);

  // Listen for chat panel width changes
  useEffect(() => {
    const handleChatPanelWidthChange = (event: CustomEvent) => {
      setChatPanelWidth(event.detail.width);
    };

    window.addEventListener(
      "chat-panel-width-change",
      handleChatPanelWidthChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "chat-panel-width-change",
        handleChatPanelWidthChange as EventListener,
      );
    };
  }, []);

  // Listen for chat panel collapsed state changes
  useEffect(() => {
    const handleChatPanelCollapsedChange = (event: CustomEvent) => {
      setChatPanelCollapsed(event.detail.collapsed);
    };

    window.addEventListener(
      "chat-panel-collapsed-change",
      handleChatPanelCollapsedChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "chat-panel-collapsed-change",
        handleChatPanelCollapsedChange as EventListener,
      );
    };
  }, []);

  return <ChatPanel isOpen={chatPanelOpen} onOpenChange={setChatPanelOpen} />;
}
