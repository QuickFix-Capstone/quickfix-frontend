//

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

const API = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

/* ================= TOKEN HELPER ================= */
async function getAccessToken() {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error("No Cognito access token found");
  }

  return token;
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD CONVERSATIONS ================= */
  useEffect(() => {
    async function loadConversations() {
      try {
        const token = await getAccessToken();

        const res = await fetch(`${API}/messages/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to load conversations:", res.status);
          setConversations([]);
          return;
        }

        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Auth / fetch error:", err);
        setConversations([]);
      }
    }

    loadConversations();
  }, []);

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!activeConversation) return;

    async function loadMessages() {
      try {
        setLoading(true);
        const token = await getAccessToken();

        const res = await fetch(
          `${API}/messages/${activeConversation.conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Failed to load messages:", res.status);
          setMessages([]);
          return;
        }

        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);

        // Mark conversation as read
        await fetch(
          `${API}/messages/conversations/${activeConversation.conversationId}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error("Message load error:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [activeConversation]);

  /* ================= SEND MESSAGE ================= */
  async function sendMessage() {
    if (!text.trim() || !activeConversation) return;

    try {
      const token = await getAccessToken();

      await fetch(`${API}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeConversation.conversationId,
          text,
        }),
      });

      // Optimistic UI update
      setMessages((prev) => [
        ...prev,
        {
          ts: Date.now(),
          senderType: "provider",
          text,
        },
      ]);

      setText("");
    } catch (err) {
      console.error("Send message failed:", err);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* ===== LEFT PANEL (INBOX) ===== */}
      <div className="w-80 border-r bg-gray-50 overflow-y-auto">
        <h2 className="p-4 font-semibold text-lg">Messages</h2>

        {Array.isArray(conversations) && conversations.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No conversations yet</p>
        )}

        {Array.isArray(conversations) &&
          conversations.map((c) => (
            <div
              key={c.conversationId}
              onClick={() => setActiveConversation(c)}
              className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
                activeConversation?.conversationId === c.conversationId
                  ? "bg-gray-200"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{c.otherUserName}</p>

                {c.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 rounded-full">
                    {c.unreadCount}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 truncate">
                {c.lastMessagePreview}
              </p>
            </div>
          ))}
      </div>

      {/* ===== RIGHT PANEL (CHAT) ===== */}
      <div className="flex-1 flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b font-semibold">
              {activeConversation.otherUserName}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {loading && (
                <p className="text-gray-400 text-sm">Loading messages...</p>
              )}

              {Array.isArray(messages) &&
                messages.map((m) => (
                  <div
                    key={m.ts}
                    className={`flex ${
                      m.senderType === "provider"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs text-sm ${
                        m.senderType === "provider"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 border rounded px-3 py-2"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
