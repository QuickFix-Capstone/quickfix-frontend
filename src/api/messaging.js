import { API_BASE } from "./config";

/**
 * Get the authentication token from OIDC localStorage
 * This works with react-oidc-context authentication
 * @returns {string} JWT ID token
 * @throws {Error} If user is not authenticated
 */
function getAuthToken() {
  // OIDC stores user data in localStorage with this key format
  const userKey = `oidc.user:https://cognito-idp.us-east-2.amazonaws.com/us-east-2_45z5OMePi:p2u5qdegml3hp60n6ohu52n2b`;

  const userDataString = localStorage.getItem(userKey);

  if (!userDataString) {
    throw new Error("User not authenticated - no OIDC session found");
  }

  try {
    const userData = JSON.parse(userDataString);
    const token = userData.id_token;

    if (!token) {
      throw new Error("User not authenticated - no ID token found");
    }

    return token;
  } catch (error) {
    throw new Error("Failed to parse authentication data");
  }
}

/**
 * Create a new conversation between the authenticated user and another user
 * @param {string} otherUserId - The ID of the other user (customer or provider)
 * @param {string} jobId - The job/booking ID to link this conversation to
 * @returns {Promise<Object>} Created conversation object
 * @throws {Error} If conversation creation fails or already exists (409)
 */
export async function createConversation(otherUserId, jobId) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/messages/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      otherUserId,
      jobId,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // If conversation already exists (409), the response includes conversationId
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
 * Get all conversations for the authenticated user
 * @param {number} limit - Maximum number of conversations to return (default: 20, max: 50)
 * @returns {Promise<Object>} Object containing conversations array and total count
 */
export async function getConversations(limit = 20) {
  const token = getAuthToken();

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
 * Send a message in an existing conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} text - The message text to send
 * @returns {Promise<Object>} The sent message object
 */
export async function sendMessage(conversationId, text) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      conversationId,
      text,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to send message");
  }

  return data;
}

/**
 * Get all messages in a conversation with pagination support
 * @param {string} conversationId - The conversation ID
 * @param {number} limit - Maximum number of messages to return (default: 50, max: 100)
 * @param {number|null} before - Timestamp to get messages before (for pagination)
 * @returns {Promise<Object>} Object containing messages array, total count, and hasMore flag
 */
export async function getMessages(conversationId, limit = 50, before = null) {
  const token = getAuthToken();

  let url = `${API_BASE}/messages/${conversationId}?limit=${limit}`;
  if (before) {
    url += `&before=${before}`;
  }

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
 * Mark a conversation as read (reset unread count to 0)
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} Updated conversation object
 */
export async function markConversationAsRead(conversationId) {
  const token = getAuthToken();

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
