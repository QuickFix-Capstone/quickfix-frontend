// src/pages/customer/Messages.jsx
import React, { useState, useEffect } from "react";
import { MessageSquare, PlusCircle } from "lucide-react";
import ConversationList from "../../components/messaging/ConversationList";
import MessageThread from "../../components/messaging/MessageThread";
import MessageInput from "../../components/messaging/MessageInput";
import NewMessageModal from "../../components/messaging/NewMessageModal";
import Button from "../../components/UI/Button";
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
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

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

  /**
   * Handle new conversation created from modal
   * @param {Object} conversation - The created conversation
   */
  function handleConversationCreated() {
    // Refresh conversations list to include new one
    loadConversations();

    // If we have a conversationId, we could auto-select it
    // For now, just refresh the list and user can select it
  }

  return (
    <>
      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={handleConversationCreated}
      />

      <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
        {/* Left Sidebar - Conversations List (30%) */}
        <div className="w-[30%] min-w-[300px] border-r border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Messages
                </h1>
                {conversations.length > 0 && (
                  <p className="mt-1 text-sm text-blue-100">
                    {conversations.length}{" "}
                    {conversations.length === 1 ? "conversation" : "conversations"}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setShowNewMessageModal(true)}
                className="gap-2 bg-white text-blue-600 hover:bg-blue-50 shadow-md"
                size="sm"
              >
                <PlusCircle className="h-4 w-4" />
                New
              </Button>
            </div>
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
              <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {selectedConversation.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedConversation.otherUser.name}
                    </h2>
                    {selectedConversation.jobTitle && (
                      <p className="text-sm text-blue-600 font-medium">
                        📋 {selectedConversation.jobTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-pink-50 px-6 py-3">
                  <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
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
            <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Select a conversation
              </h3>
              <p className="mt-3 text-sm text-slate-500 max-w-md text-center">
                Choose a conversation from the list to start messaging, or click "New" to start a new conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
