// src/components/Chatbot.jsx

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import ReactDOM from "react-dom";
import { X, Send, MessageCircle, Sparkles, RotateCw } from "lucide-react";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_ENDPOINT =
  import.meta.env.VITE_CHATBOT_API ||
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

// ============================================================================
// CHATBOT SERVICE
// ============================================================================

const sendChatMessage = async (
  message,
  conversationId = null,
  token = null,
) => {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_ENDPOINT}/chatbot/message`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        message: message,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// ============================================================================
// CHATBOT HOOK
// ============================================================================

const useChatbot = (userToken = null) => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      text: "👋 Hi! I'm QuickFix AI Assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (messageText) => {
      if (!messageText.trim()) return;

      const userMessage = {
        id: Date.now(),
        type: "user",
        text: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage(
          messageText,
          conversationId,
          userToken,
        );

        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          text: response.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setConversationId(response.conversation_id);
      } catch (err) {
        setError(err.message);

        const errorMessage = {
          id: Date.now() + 1,
          type: "bot",
          text: "I'm having trouble right now. Please try again in a moment.",
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, userToken],
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        type: "bot",
        text: "👋 Hi! I'm QuickFix AI Assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};

// ============================================================================
// CHATBOT CONTEXT
// ============================================================================

const ChatbotContext = createContext();

const useChatbotContext = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbotContext must be used within ChatbotProvider");
  }
  return context;
};

// ============================================================================
// CHATBOT BUTTON COMPONENT
// ============================================================================

const ChatbotButton = ({ isOpen, onClick, unreadCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700
                 text-white rounded-full shadow-2xl flex items-center justify-center z-[99999]
                 hover:from-blue-700 hover:to-blue-800 transition-all duration-300
                 transform hover:scale-105 active:scale-95 group relative
                 ${isOpen ? "rotate-90" : ""}`}
      aria-label={isOpen ? "Close chat" : "Open chat"}
      style={{ position: 'fixed', bottom: '24px', right: '24px' }}
    >
      {/* Unread Badge */}
      {unreadCount > 0 && !isOpen && (
        <div
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold 
                       rounded-full flex items-center justify-center border-2 border-white
                       animate-bounce"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}

      {/* Pulse Animation */}
      {!isOpen && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-pulse"></span>
        </>
      )}

      {/* Icon */}
      <div
        className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap
                      pointer-events-none"
      >
        {isOpen ? "Close chat" : "Need help? Chat with us!"}
        <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </button>
  );
};

// ============================================================================
// CHATBOT POPUP COMPONENT
// ============================================================================

const ChatbotPopup = ({
  isOpen,
  onClose,
  userToken = null,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, isLoading, error, sendMessage, clearMessages } =
    useChatbot(userToken);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage("");
    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: "How do I post a job?", icon: "📝" },
    { label: "Track my booking", icon: "📍" },
    { label: "Contact support", icon: "💬" },
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action.label);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Chatbot Window */}
      <div
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] md:w-[400px] h-[600px] md:h-[650px] 
                   bg-white rounded-2xl shadow-2xl z-[10000] flex flex-col overflow-hidden
                   border border-gray-200 transition-all duration-300 transform
                   ${isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">QuickFix AI</h3>
              <p className="text-blue-100 text-xs">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearMessages}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="New conversation"
            >
              <RotateCw className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} 
                         animate-fadeIn`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : message.isError
                      ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.text}
                </p>
                <span
                  className={`text-xs mt-1 block ${
                    message.type === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && !isLoading && (
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Quick actions:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 
                             transition-colors flex items-center space-x-1"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">⚠️ {error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed
                         text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 
                         disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center min-w-[48px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by QuickFix AI • Press Enter to send
          </p>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// CHATBOT PROVIDER (Main Export)
// ============================================================================

export const ChatbotProvider = ({
  children,
  userToken = null,
  userRole = "customer",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleChatbot = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const openChatbot = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const closeChatbot = () => {
    setIsOpen(false);
  };

  return (
    <ChatbotContext.Provider
      value={{ isOpen, openChatbot, closeChatbot, toggleChatbot }}
    >
      {children}
      {ReactDOM.createPortal(
        <>
          <ChatbotButton
            isOpen={isOpen}
            onClick={toggleChatbot}
            unreadCount={unreadCount}
          />
          <ChatbotPopup
            isOpen={isOpen}
            onClose={closeChatbot}
            userToken={userToken}
            userRole={userRole}
          />
        </>,
        document.body,
      )}
    </ChatbotContext.Provider>
  );
};

// Export hook for programmatic control
// eslint-disable-next-line react-refresh/only-export-components
export { useChatbotContext };
// Default export
export default ChatbotProvider;
