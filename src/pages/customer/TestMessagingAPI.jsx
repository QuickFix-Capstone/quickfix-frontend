// TEMPORARY TEST PAGE - DELETE AFTER TESTING
import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  markConversationAsRead,
} from "../../api/messaging";

export default function TestMessagingAPI() {
  const auth = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to add test result
  const addResult = (test, success, data, error = null) => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        success,
        data,
        error,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Test 1: Check if tokens are accessible
  const testTokenAccess = async () => {
    setLoading(true);
    try {
      console.log("=== Testing Token Access ===");

      // Check react-oidc-context tokens
      const oidcIdToken = auth.user?.id_token;
      const oidcAccessToken = auth.user?.access_token;
      console.log("OIDC ID Token:", oidcIdToken ? "✅ Present" : "❌ Missing");
      console.log("OIDC Access Token:", oidcAccessToken ? "✅ Present" : "❌ Missing");

      // Check AWS Amplify tokens
      const session = await fetchAuthSession();
      const amplifyIdToken = session.tokens?.idToken?.toString();
      const amplifyAccessToken = session.tokens?.accessToken?.toString();
      console.log("Amplify ID Token:", amplifyIdToken ? "✅ Present" : "❌ Missing");
      console.log("Amplify Access Token:", amplifyAccessToken ? "✅ Present" : "❌ Missing");

      addResult(
        "Token Access",
        true,
        {
          oidc: {
            idToken: oidcIdToken ? "Present (length: " + oidcIdToken.length + ")" : "Missing",
            accessToken: oidcAccessToken ? "Present" : "Missing",
          },
          amplify: {
            idToken: amplifyIdToken ? "Present (length: " + amplifyIdToken.length + ")" : "Missing",
            accessToken: amplifyAccessToken ? "Present" : "Missing",
          },
        }
      );
    } catch (error) {
      console.error("Token test failed:", error);
      addResult("Token Access", false, null, error.message);
    }
    setLoading(false);
  };

  // Test 2: Get Conversations
  const testGetConversations = async () => {
    setLoading(true);
    try {
      console.log("=== Testing getConversations() ===");
      const data = await getConversations(20);
      console.log("Success! Data:", data);
      addResult("Get Conversations", true, data);
    } catch (error) {
      console.error("getConversations failed:", error);
      addResult("Get Conversations", false, null, error.message);
    }
    setLoading(false);
  };

  // Test 3: Create Conversation (you'll need to provide IDs)
  const testCreateConversation = async () => {
    setLoading(true);
    const otherUserId = prompt("Enter other user ID (e.g., SP-xxx):");
    const jobId = prompt("Enter job ID:");

    if (!otherUserId || !jobId) {
      addResult("Create Conversation", false, null, "Cancelled by user");
      setLoading(false);
      return;
    }

    try {
      console.log("=== Testing createConversation() ===");
      const data = await createConversation(otherUserId, jobId);
      console.log("Success! Data:", data);
      addResult("Create Conversation", true, data);
    } catch (error) {
      console.error("createConversation failed:", error);
      addResult("Create Conversation", false, null, error.message);
    }
    setLoading(false);
  };

  // Test 4: Get Messages (requires conversation ID)
  const testGetMessages = async () => {
    setLoading(true);
    const conversationId = prompt("Enter conversation ID:");

    if (!conversationId) {
      addResult("Get Messages", false, null, "Cancelled by user");
      setLoading(false);
      return;
    }

    try {
      console.log("=== Testing getMessages() ===");
      const data = await getMessages(conversationId);
      console.log("Success! Data:", data);
      addResult("Get Messages", true, data);
    } catch (error) {
      console.error("getMessages failed:", error);
      addResult("Get Messages", false, null, error.message);
    }
    setLoading(false);
  };

  // Test 5: Send Message (requires conversation ID)
  const testSendMessage = async () => {
    setLoading(true);
    const conversationId = prompt("Enter conversation ID:");
    const text = prompt("Enter message text:");

    if (!conversationId || !text) {
      addResult("Send Message", false, null, "Cancelled by user");
      setLoading(false);
      return;
    }

    try {
      console.log("=== Testing sendMessage() ===");
      const data = await sendMessage(conversationId, text);
      console.log("Success! Data:", data);
      addResult("Send Message", true, data);
    } catch (error) {
      console.error("sendMessage failed:", error);
      addResult("Send Message", false, null, error.message);
    }
    setLoading(false);
  };

  // Test 6: Mark as Read (requires conversation ID)
  const testMarkAsRead = async () => {
    setLoading(true);
    const conversationId = prompt("Enter conversation ID:");

    if (!conversationId) {
      addResult("Mark as Read", false, null, "Cancelled by user");
      setLoading(false);
      return;
    }

    try {
      console.log("=== Testing markConversationAsRead() ===");
      const data = await markConversationAsRead(conversationId);
      console.log("Success! Data:", data);
      addResult("Mark as Read", true, data);
    } catch (error) {
      console.error("markConversationAsRead failed:", error);
      addResult("Mark as Read", false, null, error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>🧪 Messaging API Test Page</h1>
      <p>
        <strong>User:</strong> {auth.user?.profile?.email || "Not logged in"}
      </p>
      <p>
        <strong>User ID:</strong> {auth.user?.profile?.sub || "N/A"}
      </p>

      <hr />

      <h2>Test Functions</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button onClick={testTokenAccess} disabled={loading} style={buttonStyle}>
          1. Test Token Access
        </button>
        <button onClick={testGetConversations} disabled={loading} style={buttonStyle}>
          2. Get Conversations
        </button>
        <button onClick={testCreateConversation} disabled={loading} style={buttonStyle}>
          3. Create Conversation
        </button>
        <button onClick={testGetMessages} disabled={loading} style={buttonStyle}>
          4. Get Messages
        </button>
        <button onClick={testSendMessage} disabled={loading} style={buttonStyle}>
          5. Send Message
        </button>
        <button onClick={testMarkAsRead} disabled={loading} style={buttonStyle}>
          6. Mark as Read
        </button>
        <button
          onClick={() => setTestResults([])}
          disabled={loading}
          style={{ ...buttonStyle, backgroundColor: "#dc3545" }}
        >
          Clear Results
        </button>
      </div>

      {loading && <p style={{ color: "orange" }}>⏳ Testing...</p>}

      <hr />

      <h2>Test Results ({testResults.length})</h2>
      <div>
        {testResults.length === 0 && <p style={{ color: "#666" }}>No tests run yet. Click a button above to start testing.</p>}

        {testResults.map((result, index) => (
          <div
            key={index}
            style={{
              border: result.success ? "2px solid green" : "2px solid red",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
              backgroundColor: result.success ? "#d4edda" : "#f8d7da",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>
              {result.success ? "✅" : "❌"} {result.test}
              <span style={{ float: "right", fontSize: "12px", color: "#666" }}>
                {result.timestamp}
              </span>
            </h3>

            {result.success ? (
              <div>
                <strong>Response Data:</strong>
                <pre style={{ backgroundColor: "#fff", padding: "10px", overflow: "auto", fontSize: "12px" }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <strong style={{ color: "red" }}>Error:</strong> {result.error}
              </div>
            )}
          </div>
        ))}
      </div>

      <hr />
      <p style={{ color: "#666", fontSize: "12px" }}>
        💡 Open browser console (F12) to see detailed logs
        <br />
        ⚠️ This is a temporary test page - delete after verifying API works
      </p>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 15px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
};
