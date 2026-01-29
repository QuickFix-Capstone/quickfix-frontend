import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import ReactDOM from "react-dom";
import { X, Send, MessageCircle, Sparkles, RotateCw, Bot } from "lucide-react";
import { API_BASE } from "../api/config";

// ============================================================================
// CHATBOT SERVICE (NO AUTH VERSION)
// ============================================================================

/**
 * Send a message to the chatbot API (NO AUTHENTICATION REQUIRED)
 * @param {string} message - The message to send
 * @param {string|null} conversationId - The conversation ID (null for new conversations)
 * @param {string} userRole - User role (customer, service_provider, provider)
 * @param {string|null} userId - Optional user ID for authenticated users
 * @returns {Promise<Object>} Response from the API
 */
const sendChatMessage = async (
  message,
  conversationId = null,
  userRole = "customer",
  userId = null,
) => {
  try {
    console.log("Sending message to chatbot:", {
      endpoint: `${API_BASE}/chatbot/message`,
      userRole,
      conversationId,
      hasUserId: !!userId,
    });

    const response = await fetch(`${API_BASE}/chatbot/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        conversation_id: conversationId,
        user_role: userRole,
        user_id: userId, // Optional: for personalized data
      }),
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }

      // Specific error messages for common status codes
      if (response.status === 400) {
        errorMessage =
          errorData.error || "Invalid request. Please check your message.";
      } else if (response.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Chatbot response received:", data);
    return data;
  } catch (error) {
    console.error("Error sending message:", error);

    // Network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw error;
  }
};

// ============================================================================
// CHATBOT HOOK
// ============================================================================

const useChatbot = (userRole = "customer", userId = null) => {
  // Role-specific welcome messages
  const getWelcomeMessage = () => {
    if (userRole === "service_provider" || userRole === "provider") {
      return "👋 Hi! I'm QuickFix AI Assistant for Service Providers. How can I help you with your bookings or business today?";
    }
    return "👋 Hi! I'm QuickFix AI Assistant. How can I help you find services today?";
  };

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      text: getWelcomeMessage(),
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
          userRole,
          userId,
        );

        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          text:
            response.response || response.message || "I received your message.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Update conversation ID if returned
        if (response.conversation_id) {
          setConversationId(response.conversation_id);
        }
      } catch (err) {
        const errorMsg =
          err.message || "Something went wrong. Please try again.";
        setError(errorMsg);

        const errorMessage = {
          id: Date.now() + 1,
          type: "bot",
          text: errorMsg,
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, userRole, userId],
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        type: "bot",
        text: getWelcomeMessage(),
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
    setError(null);
  }, [userRole]);

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
                 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-label="Open chat"
      style={{ position: "fixed", bottom: "24px", right: "24px" }}
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

      {/* Icon */}
      <Bot className="w-6 h-6" />

      {/* Tooltip */}
      <div
        className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap
                      pointer-events-none"
      >
        Need help? Chat with us!
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
  userRole = "customer",
  userId = null,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useChatbot(
    userRole,
    userId,
  );

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

  // Role-specific quick actions
  const getQuickActions = () => {
    if (userRole === "service_provider" || userRole === "provider") {
      return [
        { label: "View my bookings", icon: "📅" },
        { label: "Update my availability", icon: "⏰" },
        { label: "Check my earnings", icon: "💰" },
      ];
    }
    return [
      { label: "How do I book a service?", icon: "📝" },
      { label: "What services are available?", icon: "🔧" },
      { label: "Contact support", icon: "💬" },
    ];
  };

  const quickActions = getQuickActions();

  const handleQuickAction = (action) => {
    setInputMessage(action.label);
    inputRef.current?.focus();
  };

  // Role-specific header title
  const getHeaderTitle = () => {
    if (userRole === "service_provider" || userRole === "provider") {
      return "Provider Assistant";
    }
    return "QuickFix AI";
  };

  const getHeaderSubtitle = () => {
    if (userRole === "service_provider" || userRole === "provider") {
      return "Business support at your fingertips";
    }
    return "Always here to help";
  };

  return (
    <>
      {/* Chatbot Side Panel */}
      <div
        className={`fixed top-0 right-0 w-full sm:w-[400px] h-full
                   bg-white shadow-2xl z-[10000] flex flex-col overflow-hidden
                   border-l border-gray-200 transition-transform duration-300 ease-in-out
                   ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {getHeaderTitle()}
              </h3>
              <p className="text-blue-100 text-xs">{getHeaderSubtitle()}</p>
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
  userRole = "customer",
  userId = null,
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

  // Log initialization for debugging
  useEffect(() => {
    console.log("ChatbotProvider initialized (NO AUTH):", {
      userRole,
      hasUserId: !!userId,
    });
  }, [userRole, userId]);

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
            userRole={userRole}
            userId={userId}
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
