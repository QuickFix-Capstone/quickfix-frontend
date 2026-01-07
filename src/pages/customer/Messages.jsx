// src/pages/customer/Messages.jsx
import React, { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import ConversationList from "../../components/messaging/ConversationList";
import MessageThread from "../../components/messaging/MessageThread";
import MessageInput from "../../components/messaging/MessageInput";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from "../../api/messaging";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();

    // Poll for new messages every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessagesForConversation(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  /**
   * Load all conversations
   */
  async function loadConversations() {
    try {
      setError(null);
      const data = await getConversations(50);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoadingConversations(false);
    }
  }

  /**
   * Load messages for a specific conversation
   * @param {string} conversationId
   */
  async function loadMessagesForConversation(conversationId) {
    try {
      setLoadingMessages(true);
      setError(null);

      const data = await getMessages(conversationId, 100);
      setMessages(data.messages || []);

      // Mark conversation as read
      await markConversationAsRead(conversationId);

      // Update unread count in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  }

  /**
   * Handle conversation selection
   * @param {Object} conversation
   */
  function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);
  }

  /**
   * Handle sending a message
   * @param {string} text - Message text
   */
  async function handleSendMessage(text) {
    if (!selectedConversation || !text.trim()) return;

    try {
      setSendingMessage(true);
      setError(null);

      const sentMessage = await sendMessage(
        selectedConversation.conversationId,
        text
      );

      // Add message to UI immediately
      setMessages((prev) => [...prev, sentMessage]);

      // Refresh conversations to update preview and timestamp
      loadConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-neutral-100">
      {/* Left Sidebar - Conversations List (30%) */}
      <div className="w-[30%] min-w-[300px] border-r border-neutral-200 bg-white">
        {/* Header */}
        <div className="border-b border-neutral-200 bg-white px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
          {conversations.length > 0 && (
            <p className="mt-1 text-sm text-neutral-500">
              {conversations.length}{" "}
              {conversations.length === 1 ? "conversation" : "conversations"}
            </p>
          )}
        </div>

        {/* Conversations List */}
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelect={handleSelectConversation}
          loading={loadingConversations}
        />
      </div>

      {/* Right Panel - Message Thread (70%) */}
      <div className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="border-b border-neutral-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {selectedConversation.otherUser.name}
              </h2>
              {selectedConversation.jobTitle && (
                <p className="mt-1 text-sm text-neutral-500">
                  Job: {selectedConversation.jobTitle}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="border-b border-red-200 bg-red-50 px-6 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Messages Thread */}
            <MessageThread messages={messages} loading={loadingMessages} />

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              disabled={sendingMessage}
            />
          </>
        ) : (
          // No conversation selected - empty state
          <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50">
            <MessageSquare className="h-16 w-16 text-neutral-300" />
            <h3 className="mt-4 text-lg font-medium text-neutral-600">
              Select a conversation
            </h3>
            <p className="mt-2 text-sm text-neutral-400">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
