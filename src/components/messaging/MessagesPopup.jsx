import React, { useState, useEffect } from "react";
import { MessageSquare, X, PlusCircle, ArrowLeft } from "lucide-react";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import MessageInput from "./MessageInput";
import NewMessageModal from "./NewMessageModal";
import Button from "../UI/Button";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from "../../api/messagingProvider";

export default function MessagesPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessagesForConversation(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  async function loadConversations() {
    try {
      setError(null);
      const data = await getConversations(50);
      const convos = data.conversations || [];
      setConversations(convos);
      // Count unread messages
      const unread = convos.filter((c) => c.unreadCount > 0).length;
      setUnreadCount(unread);
    } catch {
      setError("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessagesForConversation(conversationId) {
    try {
      setLoadingMessages(true);
      const data = await getMessages(conversationId, 100);
      setMessages(data.messages || []);
      await markConversationAsRead(conversationId);
      loadConversations(); // Refresh to update unread count
    } catch {
      setError("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSendMessage(text) {
    if (!text.trim() || !selectedConversation) return;
    try {
      setSendingMessage(true);
      const sent = await sendMessage(selectedConversation.conversationId, text);
      setMessages((prev) => [...prev, sent]);
      loadConversations();
    } finally {
      setSendingMessage(false);
    }
  }

  function handleBack() {
    setSelectedConversation(null);
  }

  return (
    <>
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={loadConversations}
      />

      {/* Floating Button - positioned on left to avoid AI chatbot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Popup Window - positioned on left to avoid AI chatbot */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[380px] h-[500px] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="text-white/80 hover:text-white transition"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {selectedConversation.otherUser.name[0]}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {selectedConversation.otherUser.name}
                    </h3>
                    {selectedConversation.jobTitle && (
                      <p className="text-white/70 text-xs truncate max-w-[180px]">
                        {selectedConversation.jobTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="text-white font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </h3>
            )}
            <div className="flex items-center gap-2">
              {!selectedConversation && (
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30 p-1.5"
                  onClick={() => setShowNewMessageModal(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2">
                {error}
              </div>
            )}

            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto">
                  <MessageThread messages={messages} loading={loadingMessages} />
                </div>
                <div className="border-t bg-white">
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={sendingMessage}
                    compact
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelect={setSelectedConversation}
                  loading={loadingConversations}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
