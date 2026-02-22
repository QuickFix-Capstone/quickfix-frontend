import { API_BASE } from "./config";

const MESSAGING_API_BASE =
  import.meta.env.VITE_MESSAGING_API_BASE_URL || API_BASE;

const MESSAGING_API_BASE_CANDIDATES = Array.from(
  new Set([
    MESSAGING_API_BASE,
    API_BASE,
    API_BASE.endsWith("/prod") ? API_BASE.slice(0, -"/prod".length) : null,
  ].filter(Boolean)),
);

function shouldTryFallback(status) {
  return [500, 502, 503, 504, 404].includes(Number(status));
}

async function safeReadJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function messagingRequest(path, { method = "GET", token, body } = {}) {
  let lastErrorData = {};
  let lastStatus = 0;

  for (let index = 0; index < MESSAGING_API_BASE_CANDIDATES.length; index += 1) {
    const base = MESSAGING_API_BASE_CANDIDATES[index];
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await safeReadJson(res);

    if (res.ok) {
      return { data, status: res.status };
    }

    lastErrorData = data;
    lastStatus = res.status;

    const isLastCandidate = index === MESSAGING_API_BASE_CANDIDATES.length - 1;
    if (!shouldTryFallback(res.status) || isLastCandidate) {
      const error = new Error(
        data.message || `Messaging request failed (${res.status})`,
      );
      error.status = res.status;
      error.data = data;
      throw error;
    }
  }

  const fallbackError = new Error(
    lastErrorData.message || `Messaging request failed (${lastStatus || "unknown"})`,
  );
  fallbackError.status = lastStatus;
  fallbackError.data = lastErrorData;
  throw fallbackError;
}

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
    const token = userData.access_token || userData.id_token;

    if (!token) {
      throw new Error("User not authenticated - no ID token found");
    }

    return token;
  } catch {
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

  try {
    const { data } = await messagingRequest("/messages/conversations", {
      method: "POST",
      token,
      body: {
        otherUserId,
        jobId,
      },
    });

    return data;
  } catch (error) {
    // If conversation already exists (409), the response includes conversationId
    if (error.status === 409) {
      const conflictError = new Error("Conversation already exists");
      conflictError.conversationId = error.data?.conversationId;
      conflictError.status = 409;
      throw conflictError;
    }

    throw new Error(error.data?.message || "Failed to create conversation");
  }
}

/**
 * Get all conversations for the authenticated user
 * @param {number} limit - Maximum number of conversations to return (default: 20, max: 50)
 * @returns {Promise<Object>} Object containing conversations array and total count
 */
export async function getConversations(limit = 20) {
  const token = getAuthToken();
  try {
    const { data } = await messagingRequest(
      `/messages/conversations?limit=${limit}`,
      {
        method: "GET",
        token,
      },
    );
    return data;
  } catch (error) {
    // Some environments currently return 500 for list fetch while other message endpoints still work.
    if (Number(error?.status) >= 500) {
      return { conversations: [], pagination: { total: 0, has_more: false } };
    }
    throw error;
  }
}

/**
 * Send a message in an existing conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} text - The message text to send
 * @returns {Promise<Object>} The sent message object
 */
export async function sendMessage(conversationId, text) {
  const token = getAuthToken();

  const { data } = await messagingRequest("/messages", {
    method: "POST",
    token,
    body: {
      conversationId,
      text,
    },
  });

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

  let path = `/messages/${conversationId}?limit=${limit}`;
  if (before) {
    path += `&before=${before}`;
  }

  const { data } = await messagingRequest(path, {
    method: "GET",
    token,
  });

  return data;
}

/**
 * Mark a conversation as read (reset unread count to 0)
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} Updated conversation object
 */
export async function markConversationAsRead(conversationId) {
  const token = getAuthToken();

  const { data } = await messagingRequest(
    `/messages/conversations/${conversationId}/read`,
    {
      method: "PUT",
      token,
    },
  );

  return data;
}
