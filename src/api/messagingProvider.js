import { API_BASE } from "./config";
import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Get the authentication token from AWS Amplify session
 * This works for Service Providers authenticated via Cognito + Amplify
 * @returns {Promise<string>} JWT ID token
 * @throws {Error} If user is not authenticated
 */
async function getAuthToken() {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
    throw new Error("User not authenticated - no Amplify session found");
  }

  return token;
}

/**
 * Create a new conversation
 */
export async function createConversation(otherUserId, jobId) {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/messages/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otherUserId, jobId }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 409) {
      const error = new Error("Conversation already exists");
      error.conversationId = data.conversationId;
      error.status = 409;
      throw error;
    }
    throw new Error(data.message || "Failed to create conversation");
  }

  return data;
}

/**
 * Get all conversations
 */
export async function getConversations(limit = 20) {
  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE}/messages/conversations?limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch conversations");
  }

  return data;
}

/**
 * Send a message
 */
export async function sendMessage(conversationId, text) {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, text }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to send message");
  }

  return data;
}

/**
 * Get messages in a conversation
 */
export async function getMessages(conversationId, limit = 50, before = null) {
  const token = await getAuthToken();

  let url = `${API_BASE}/messages/${conversationId}?limit=${limit}`;
  if (before) url += `&before=${before}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch messages");
  }

  return data;
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(conversationId) {
  const token = await getAuthToken();

  const res = await fetch(
    `${API_BASE}/messages/conversations/${conversationId}/read`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to mark conversation as read");
  }

  return data;
}