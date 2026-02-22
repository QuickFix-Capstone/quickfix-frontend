// src/pages/customer/Messages.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, PlusCircle } from "lucide-react";
import { useAuth } from "react-oidc-context";
import ConversationList from "../../components/messaging/ConversationList";
import MessageThread from "../../components/messaging/MessageThread";
import MessageInput from "../../components/messaging/MessageInput";
import NewMessageModal from "../../components/messaging/NewMessageModal";
import Button from "../../components/UI/Button";
import useMessagingWebSocket from "../../hooks/useMessagingWebSocket";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from "../../api/messaging";

function normalizeMessagePayload(event) {
  const payload = event?.message && typeof event.message === "object" ? event.message : event;
  if (!payload || typeof payload !== "object") return null;

  const conversationId =
    payload.conversationId ||
    payload.conversation_id ||
    payload.chatId ||
    payload.chat_id;

  const timestamp = Number(
    payload.timestamp || payload.createdAt || payload.created_at || Date.now(),
  );

  const senderId = String(
    payload.senderId || payload.sender_id || payload.sender?.id || "",
  );

  const text = payload.text || payload.content || "";

  return {
    ...payload,
    messageId:
      payload.messageId ||
      payload.id ||
      `${conversationId || "conversation"}-${timestamp}-${senderId || "unknown"}`,
    conversationId,
    senderId,
    senderName:
      payload.senderName || payload.sender_name || payload.sender?.name || "User",
    text,
    timestamp,
    status: payload.status,
    readAt: payload.readAt || payload.read_at || null,
    deliveredAt: payload.deliveredAt || payload.delivered_at || null,
  };
}

function upsertMessage(existingMessages, incomingMessage) {
  if (!incomingMessage?.messageId) return existingMessages;

  const existingIndex = existingMessages.findIndex(
    (msg) => String(msg.messageId) === String(incomingMessage.messageId),
  );

  if (existingIndex === -1) {
    return [...existingMessages, incomingMessage].sort(
      (a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0),
    );
  }

  const next = [...existingMessages];
  next[existingIndex] = { ...next[existingIndex], ...incomingMessage };
  return next;
}

export default function Messages() {
  const auth = useAuth();
  const currentUserId = useMemo(
    () => String(auth.user?.profile?.sub || ""),
    [auth.user],
  );

  const typingTimeoutRef = useRef(new Map());

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await getConversations(50);
      const nextConversations = data.conversations || [];
      setConversations(nextConversations);
      setSelectedConversation((prev) => {
        if (!prev) return null;
        return (
          nextConversations.find(
            (conv) => conv.conversationId === prev.conversationId,
          ) || prev
        );
      });
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessagesForConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      try {
        setLoadingMessages(true);
        setError(null);

        const data = await getMessages(conversationId, 100);
        const normalized = (data.messages || []).map((message) =>
          normalizeMessagePayload(message),
        );
        setMessages(normalized.filter(Boolean));

        await markConversationAsRead(conversationId);

        setConversations((prev) =>
          prev.map((conv) =>
            conv.conversationId === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv,
          ),
        );
      } catch (err) {
        console.error("Failed to load messages:", err);
        setError("Failed to load messages. Please try again.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversation?.conversationId) return;

    loadMessagesForConversation(selectedConversation.conversationId);
    setTypingUsers([]);
  }, [selectedConversation, loadMessagesForConversation]);

  useEffect(() => {
    const timers = typingTimeoutRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const { sendTypingStart, sendTypingStop, sendReadReceipt } =
    useMessagingWebSocket({
      enabled: auth.isAuthenticated,
      userId: currentUserId,
      onMessage: async (incomingEvent) => {
        const incoming = normalizeMessagePayload(incomingEvent);
        if (!incoming?.conversationId || !incoming.text) return;

        const isOwnMessage = incoming.senderId === currentUserId;
        const isSelectedConversation =
          selectedConversation?.conversationId === incoming.conversationId;

        setConversations((prev) => {
          const next = prev.map((conv) => {
            if (conv.conversationId !== incoming.conversationId) return conv;

            return {
              ...conv,
              unreadCount:
                isSelectedConversation || isOwnMessage
                  ? 0
                  : Number(conv.unreadCount || 0) + 1,
              lastMessage: {
                ...(conv.lastMessage || {}),
                preview: incoming.text,
                timestamp: incoming.timestamp,
              },
            };
          });

          const exists = next.some(
            (conv) => conv.conversationId === incoming.conversationId,
          );

          if (!exists) {
            loadConversations();
          }

          return next;
        });

        if (isSelectedConversation) {
          setMessages((prev) => upsertMessage(prev, incoming));

          if (!isOwnMessage) {
            try {
              await markConversationAsRead(incoming.conversationId);
              sendReadReceipt(incoming.conversationId, incoming.messageId);
            } catch {
              // Keep UI optimistic if read receipt call fails.
            }
          }
        }
      },
      onTyping: (incomingEvent, eventType) => {
        const payload = normalizeMessagePayload(incomingEvent);
        const conversationId =
          payload?.conversationId ||
          incomingEvent?.conversationId ||
          incomingEvent?.conversation_id;
        const senderId = String(
          payload?.senderId ||
            incomingEvent?.senderId ||
            incomingEvent?.sender_id ||
            "",
        );

        if (!conversationId || !senderId) return;
        if (conversationId !== selectedConversation?.conversationId) return;
        if (senderId === currentUserId) return;

        const lowerType = String(eventType || "").toLowerCase();
        const isTyping =
          incomingEvent?.isTyping ??
          payload?.isTyping ??
          (lowerType.includes("start") || lowerType.includes("typing"));

        const senderName =
          payload?.senderName || incomingEvent?.senderName || "Someone";

        if (!isTyping) {
          setTypingUsers((prev) => prev.filter((name) => name !== senderName));
          const currentTimer = typingTimeoutRef.current.get(senderId);
          if (currentTimer) clearTimeout(currentTimer);
          typingTimeoutRef.current.delete(senderId);
          return;
        }

        setTypingUsers((prev) =>
          prev.includes(senderName) ? prev : [...prev, senderName],
        );

        const existingTimer = typingTimeoutRef.current.get(senderId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = window.setTimeout(() => {
          setTypingUsers((prev) => prev.filter((name) => name !== senderName));
          typingTimeoutRef.current.delete(senderId);
        }, 2200);

        typingTimeoutRef.current.set(senderId, timer);
      },
      onReadReceipt: (incomingEvent) => {
        const payload = normalizeMessagePayload(incomingEvent);
        const conversationId =
          payload?.conversationId ||
          incomingEvent?.conversationId ||
          incomingEvent?.conversation_id;

        if (conversationId !== selectedConversation?.conversationId) return;

        const readMessageId =
          payload?.messageId ||
          incomingEvent?.messageId ||
          incomingEvent?.lastReadMessageId;

        const readAt =
          incomingEvent?.readAt ||
          incomingEvent?.read_at ||
          payload?.readAt ||
          Date.now();

        if (!readMessageId) return;

        setMessages((prev) =>
          prev.map((msg) =>
            String(msg.messageId) === String(readMessageId)
              ? { ...msg, status: "read", readAt }
              : msg,
          ),
        );
      },
    });

  function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);
  }

  async function handleSendMessage(text) {
    if (!selectedConversation || !text.trim()) return;

    try {
      setSendingMessage(true);
      setError(null);

      const sentMessage = await sendMessage(
        selectedConversation.conversationId,
        text,
      );

      const normalizedSent = normalizeMessagePayload(sentMessage);
      if (normalizedSent) {
        setMessages((prev) => upsertMessage(prev, normalizedSent));
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversationId === selectedConversation.conversationId
            ? {
                ...conv,
                lastMessage: {
                  ...(conv.lastMessage || {}),
                  preview: text,
                  timestamp: Date.now(),
                },
              }
            : conv,
        ),
      );

      sendTypingStop(selectedConversation.conversationId);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  }

  function handleConversationCreated() {
    loadConversations();
  }

  function handleTypingChange(isTyping) {
    if (!selectedConversation?.conversationId) return;

    if (isTyping) {
      sendTypingStart(selectedConversation.conversationId);
      return;
    }

    sendTypingStop(selectedConversation.conversationId);
  }

  return (
    <>
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={handleConversationCreated}
      />

      <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
        <div className="w-[30%] min-w-[300px] border-r border-slate-200 bg-white shadow-xl">
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
                    {conversations.length === 1
                      ? "conversation"
                      : "conversations"}
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

          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelect={handleSelectConversation}
            loading={loadingConversations}
          />
        </div>

        <div className="flex flex-1 flex-col">
          {selectedConversation ? (
            <>
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

              {error && (
                <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-pink-50 px-6 py-3">
                  <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
                </div>
              )}

              <MessageThread
                messages={messages}
                loading={loadingMessages}
                typingUsers={typingUsers}
              />

              <MessageInput
                onSend={handleSendMessage}
                disabled={sendingMessage}
                onTypingChange={handleTypingChange}
                typingIndicatorText={typingUsers.length ? `${typingUsers.join(", ")} typing...` : ""}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Select a conversation
              </h3>
              <p className="mt-3 text-sm text-slate-500 max-w-md text-center">
                Choose a conversation from the list to start messaging, or click
                "New" to start a new conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
