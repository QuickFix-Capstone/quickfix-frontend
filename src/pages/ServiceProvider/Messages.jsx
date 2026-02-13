// src/pages/ServiceProvider/Messages.jsx
import React, { useState, useEffect } from "react";
import { MessageSquare, PlusCircle, ArrowLeft } from "lucide-react";
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
} from "../../api/messagingProvider";

export default function ProviderMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function silentRefresh() {
    setRefreshKey((prev) => prev + 1);
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessagesForConversation(selectedConversation.conversationId);
    }
  }, [selectedConversation, refreshKey]);

  async function loadConversations() {
    try {
      setError(null);
      const data = await getConversations(50);
      setConversations(data.conversations || []);
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
      silentRefresh();
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <>
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={silentRefresh}
      />

      <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Sidebar */}
        <aside
          className={`${
            selectedConversation ? "hidden md:flex" : "flex"
          } md:w-[340px] w-full flex-col border-r bg-white`}
        >
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </h1>
              <Button
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => setShowNewMessageModal(true)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelect={setSelectedConversation}
            loading={loadingConversations}
          />
        </aside>

        {/* Chat Panel */}
        <main
          className={`${
            selectedConversation ? "flex" : "hidden md:flex"
          } flex-1 flex-col`}
        >
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden text-slate-500"
                >
                  <ArrowLeft />
                </button>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {selectedConversation.otherUser.name[0]}
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    {selectedConversation.otherUser.name}
                  </h2>
                  {selectedConversation.jobTitle && (
                    <p className="text-xs text-blue-600">
                      📋 {selectedConversation.jobTitle}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-2">
                  ⚠️ {error}
                </div>
              )}

              <MessageThread messages={messages} loading={loadingMessages} />

              {/* Input */}
              <div className="sticky bottom-0 bg-white border-t">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={sendingMessage}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Your inbox is empty
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Select a conversation or start a new one
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
