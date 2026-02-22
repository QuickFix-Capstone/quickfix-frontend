import React, { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { MessageSquare, PlusCircle, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import ConversationList from "../../components/messaging/ConversationList";
import MessageThread from "../../components/messaging/MessageThread";
import MessageInput from "../../components/messaging/MessageInput";
import NewMessageModal from "../../components/messaging/NewMessageModal";
import Button from "../../components/UI/Button";
import { useMessagingWebSocket } from "../../hooks/useMessagingWebSocket";
import {
  createConversation,
  getConversations as httpGetConversations,
  getMessages as httpGetMessages,
  sendMessage as httpSendMessage,
  markConversationAsRead as httpMarkRead,
} from "../../api/messagingProvider";

const WS_REQUEST_TIMEOUT_MS = 2500;
const CONVERSATIONS_LIMIT = 30;
const INITIAL_MESSAGES_LIMIT = 50;

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
    ),
  ]);
}

export default function ProviderMessages() {
  const { ws, isConnected, isInitializing } = useMessagingWebSocket();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setCurrentUserId(u.userId))
      .catch(() => {});
  }, []);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const activeConvIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Keep ref in sync with selected conversation
  useEffect(() => {
    activeConvIdRef.current = selectedConversation?.conversationId || null;
  }, [selectedConversation]);

  // Load conversations — use WebSocket if connected, otherwise HTTP fallback
  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      setLoadingConversations(true);
      let data;
      if (ws && isConnected) {
        try {
          data = await withTimeout(
            ws.getConversations(CONVERSATIONS_LIMIT),
            WS_REQUEST_TIMEOUT_MS,
          );
        } catch {
          data = await httpGetConversations(CONVERSATIONS_LIMIT);
        }
      } else {
        data = await httpGetConversations(CONVERSATIONS_LIMIT);
      }
      setConversations(data.conversations || []);
    } catch {
      setError("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }, [ws, isConnected]);

  // Initial load + polling fallback when WS is disconnected
  useEffect(() => {
    loadConversations();

    // Poll every 10s whenever WebSocket is not connected
    if (!isInitializing && !isConnected) {
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [loadConversations, isConnected, isInitializing, ws]);

  // Subscribe to push events when WebSocket is available
  useEffect(() => {
    if (!ws) return;

    const unsubMessage = ws.on("newMessage", (data) => {
      if (data.conversationId === activeConvIdRef.current) {
        setMessages((prev) => [...prev, data]);
        ws.markRead(data.conversationId);
      }

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.conversationId === data.conversationId
            ? {
                ...c,
                lastMessage: {
                  preview: data.text?.substring(0, 100),
                  timestamp: data.timestamp,
                },
                unreadCount:
                  data.conversationId === activeConvIdRef.current
                    ? 0
                    : (c.unreadCount || 0) + 1,
              }
            : c
        );
        return updated.sort(
          (a, b) =>
            (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
        );
      });
    });

    const unsubTyping = ws.on("typing", (data) => {
      if (data.conversationId === activeConvIdRef.current) {
        if (data.isTyping) {
          setTypingUser(data.userName);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => setTypingUser(null),
            5000,
          );
        } else {
          setTypingUser(null);
        }
      }
    });

    const unsubRead = ws.on("conversationRead", (data) => {
      console.log(
        `${data.readByUserId} read conversation ${data.conversationId}`,
      );
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
    };
  }, [ws]);

  // Open a conversation
  const openConversation = useCallback(
    async (conv) => {
      setSelectedConversation(conv);
      setMessages([]);
      setTypingUser(null);
      setLoadingMessages(true);
      setError(null);

      try {
        let data;
        if (ws && isConnected) {
          try {
            data = await withTimeout(
              ws.getMessages(conv.conversationId, INITIAL_MESSAGES_LIMIT),
              WS_REQUEST_TIMEOUT_MS,
            );
          } catch {
            data = await httpGetMessages(
              conv.conversationId,
              INITIAL_MESSAGES_LIMIT,
            );
          }
        } else {
          data = await httpGetMessages(conv.conversationId, INITIAL_MESSAGES_LIMIT);
        }
        // API returns newest-first, reverse for chronological display
        setMessages((data.messages || []).reverse());

        if (ws && isConnected) {
          // Do not block UI render on read receipts.
          ws
            .markRead(conv.conversationId)
            .catch(() => httpMarkRead(conv.conversationId))
            .catch(() => {});
        } else {
          httpMarkRead(conv.conversationId).catch(() => {});
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === conv.conversationId
              ? { ...c, unreadCount: 0 }
              : c
          ),
        );
      } catch {
        setError("Failed to load messages.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [ws, isConnected],
  );

  // Send a message
  async function handleSendMessage(text) {
    if (!text.trim() || !selectedConversation) return;
    try {
      setSendingMessage(true);
      let result;
      if (ws && isConnected) {
        result = await ws.sendMessage(
          selectedConversation.conversationId,
          text,
        );
      } else {
        result = await httpSendMessage(
          selectedConversation.conversationId,
          text,
        );
      }
      setMessages((prev) => [...prev, result]);

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.conversationId === selectedConversation.conversationId
            ? {
                ...c,
                lastMessage: {
                  preview: text.substring(0, 100),
                  timestamp: result.timestamp,
                },
              }
            : c
        );
        return updated.sort(
          (a, b) =>
            (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
        );
      });
    } catch {
      setError("Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  }

  // Typing indicator (only available via WebSocket)
  function handleTyping(isTyping) {
    if (!ws || !isConnected || !selectedConversation) return;
    ws.sendTyping(selectedConversation.conversationId, isTyping);
  }

  // Poll messages for the selected conversation as a fallback
  // (ensures new messages appear even if WebSocket push events fail)
  useEffect(() => {
    const convId = selectedConversation?.conversationId;
    if (!convId) return;

    const poll = async () => {
      try {
        const data = await httpGetMessages(convId, INITIAL_MESSAGES_LIMIT);
        const fresh = (data.messages || []).reverse();
        setMessages((prev) => {
          // Only update if there are actually new messages
          if (fresh.length === prev.length) {
            const lastFresh = fresh[fresh.length - 1];
            const lastPrev = prev[prev.length - 1];
            if (lastFresh?.messageId === lastPrev?.messageId) return prev;
          }
          return fresh;
        });
      } catch {
        // silently ignore polling errors
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation?.conversationId]);

  // New conversation created via modal
  function handleConversationCreated() {
    loadConversations();
  }

  return (
    <>
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={handleConversationCreated}
        createConversationFn={createConversation}
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
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-300" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-300" />
                )}
                <Button
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowNewMessageModal(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelect={openConversation}
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
                      {selectedConversation.jobTitle}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-2">
                  {error}
                </div>
              )}

              <MessageThread
                messages={messages}
                loading={loadingMessages}
                currentUserId={currentUserId}
                typingUser={typingUser}
              />

              {/* Input */}
              <div className="sticky bottom-0 bg-white border-t">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={sendingMessage}
                  onTyping={handleTyping}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Your inbox
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
