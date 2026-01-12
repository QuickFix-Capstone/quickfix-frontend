# QuickFix Messaging System - Implementation Documentation

## Overview

This document provides complete implementation details for the QuickFix messaging system. The **customer side is fully implemented** and serves as a reference for implementing the **service provider side**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend API Reference](#backend-api-reference)
3. [Frontend Implementation](#frontend-implementation)
4. [Customer Implementation (Reference)](#customer-implementation-reference)
5. [Service Provider Implementation Guide](#service-provider-implementation-guide)
6. [Shared Components](#shared-components)
7. [Testing Guide](#testing-guide)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Customer   │  │   Provider   │  │    Shared    │     │
│  │    Pages     │  │    Pages     │  │  Components  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
│         └─────────────────┴──────────────────┘             │
│                           │                                │
│                  ┌────────▼────────┐                       │
│                  │  API Layer      │                       │
│                  │ (messaging.js)  │                       │
│                  └────────┬────────┘                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  AWS API Gateway│
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
      ┌───────▼───────┐          ┌───────▼────────┐
      │   DynamoDB    │          │   Cognito      │
      │ (Conversations│          │ (Auth/Users)   │
      │  & Messages)  │          └────────────────┘
      └───────────────┘
```

### Authentication Flow

- **Customer**: Uses `react-oidc-context` with AWS Cognito
- **Provider**: Uses `aws-amplify/auth` with AWS Cognito
- **Token Storage**:
  - Customer: localStorage via OIDC (`oidc.user:...`)
  - Provider: AWS Amplify session storage

---

## Backend API Reference

### Base URL
```
https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer {token}` header.

### Endpoints

#### 1. Create Conversation
```
POST /messages/conversations
```

**Request Body:**
```json
{
  "otherUserId": "SP-ad86b044-9f9b-49b6-a53d-d3847afabe3c",
  "jobId": "1001"
}
```

**Response (201):**
```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "otherUser": {
    "userId": "SP-ad86b044-9f9b-49b6-a53d-d3847afabe3c",
    "name": "John Smith",
    "type": "provider"
  },
  "jobId": "1001",
  "createdAt": 1704380000000
}
```

**Error (409):** Conversation already exists
```json
{
  "message": "Conversation already exists",
  "conversationId": "existing-id"
}
```

#### 2. List Conversations
```
GET /messages/conversations?limit=20
```

**Response (200):**
```json
{
  "conversations": [
    {
      "conversationId": "550e8400-...",
      "otherUser": {
        "userId": "SP-...",
        "name": "John Smith",
        "type": "provider"
      },
      "jobId": "1001",
      "jobTitle": "Fix Kitchen Sink",
      "lastMessage": {
        "preview": "I can start tomorrow",
        "timestamp": 1704384000000
      },
      "unreadCount": 2,
      "createdAt": 1704380000000
    }
  ],
  "total": 5
}
```

#### 3. Send Message
```
POST /messages
```

**Request Body:**
```json
{
  "conversationId": "550e8400-...",
  "text": "Hello, when can you start?"
}
```

**Response (201):**
```json
{
  "messageId": 1704384000000,
  "conversationId": "550e8400-...",
  "senderId": "2",
  "senderName": "KunPeng Yang",
  "senderType": "customer",
  "text": "Hello, when can you start?",
  "timestamp": 1704384000000,
  "createdAt": "2026-01-04T14:00:00Z"
}
```

#### 4. Get Messages
```
GET /messages/{conversationId}?limit=50&before={timestamp}
```

**Response (200):**
```json
{
  "messages": [
    {
      "messageId": 1704384000000,
      "senderId": "2",
      "senderName": "KunPeng Yang",
      "senderType": "customer",
      "text": "Hello, when can you start?",
      "timestamp": 1704384000000,
      "readBy": ["2"],
      "createdAt": "2026-01-04T14:00:00Z"
    }
  ],
  "total": 10,
  "hasMore": false
}
```

#### 5. Mark as Read
```
PUT /messages/conversations/{conversationId}/read
```

**Response (200):**
```json
{
  "conversationId": "550e8400-...",
  "unreadCount": 0,
  "message": "Conversation marked as read"
}
```

---

## Frontend Implementation

### Project Structure

```
src/
├── api/
│   └── messaging.js              # API functions
├── components/
│   ├── messaging/                # Shared messaging components
│   │   ├── ConversationList.jsx
│   │   ├── MessageThread.jsx
│   │   ├── MessageInput.jsx
│   │   └── UnreadBadge.jsx
│   └── navigation/
│       └── CustomerNav.jsx       # Customer navigation (with unread badge)
└── pages/
    ├── customer/
    │   ├── Messages.jsx          # Customer messages page
    │   ├── Dashboard.jsx         # Updated with message card
    │   ├── ServiceList.jsx       # Added message buttons
    │   └── Bookings.jsx          # Added message buttons
    └── ServiceProvider/
        └── Messages.jsx          # TO BE IMPLEMENTED
```

---

## Customer Implementation (Reference)

### 1. API Layer (`src/api/messaging.js`)

```javascript
import { API_BASE } from "./config";

/**
 * Get authentication token from OIDC localStorage
 */
function getAuthToken() {
  const userKey = `oidc.user:https://cognito-idp.us-east-2.amazonaws.com/us-east-2_45z5OMePi:p2u5qdegml3hp60n6ohu52n2b`;
  const userDataString = localStorage.getItem(userKey);

  if (!userDataString) {
    throw new Error("User not authenticated");
  }

  const userData = JSON.parse(userDataString);
  return userData.id_token;
}

/**
 * Get all conversations
 */
export async function getConversations(limit = 20) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/messages/conversations?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch conversations");
  return data;
}

// ... other functions: createConversation, sendMessage, getMessages, markConversationAsRead
```

**Key Implementation Notes:**
- Uses OIDC token from localStorage
- All functions throw errors for proper error handling
- 409 error handling for duplicate conversations

### 2. Shared Components

#### UnreadBadge (`src/components/messaging/UnreadBadge.jsx`)

```javascript
export default function UnreadBadge({ count }) {
  if (!count || count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
}
```

#### MessageInput (`src/components/messaging/MessageInput.jsx`)

**Features:**
- Enter to send, Shift+Enter for new line
- Disabled state support
- Auto-clear after send

```javascript
export default function MessageInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setMessage("");
  };

  // ... implementation
}
```

#### MessageThread (`src/components/messaging/MessageThread.jsx`)

**Features:**
- Auto-scroll to bottom on new messages
- Different styles for sent vs received
- Relative timestamps
- Loading and empty states

```javascript
export default function MessageThread({ messages = [], loading = false }) {
  const auth = useAuth();
  const messagesEndRef = useRef(null);
  const currentUserId = auth.user?.profile?.sub;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... implementation with message rendering
}
```

#### ConversationList (`src/components/messaging/ConversationList.jsx`)

**Features:**
- Unread badges on conversations
- Last message preview
- Relative timestamps
- Selected state highlighting

### 3. Main Messages Page (`src/pages/customer/Messages.jsx`)

**Layout:**
- Desktop split-view: 30% conversations / 70% messages
- Real-time polling every 10 seconds
- Auto-mark as read when opening conversation

**Key State:**
```javascript
const [conversations, setConversations] = useState([]);
const [selectedConversation, setSelectedConversation] = useState(null);
const [messages, setMessages] = useState([]);
const [loadingConversations, setLoadingConversations] = useState(true);
const [loadingMessages, setLoadingMessages] = useState(false);
```

**Polling Implementation:**
```javascript
useEffect(() => {
  loadConversations();
  const interval = setInterval(loadConversations, 10000); // Every 10 seconds
  return () => clearInterval(interval);
}, []);
```

### 4. Navigation Integration (`src/components/navigation/CustomerNav.jsx`)

**Unread Badge in Navigation:**
```javascript
const [totalUnread, setTotalUnread] = useState(0);

useEffect(() => {
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
  return () => clearInterval(interval);
}, []);

async function fetchUnreadCount() {
  try {
    const data = await getConversations(50);
    const total = data.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    setTotalUnread(total);
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
  }
}
```

### 5. Entry Points

#### ServiceList.jsx - Message Provider Button

```javascript
import { MessageSquare } from "lucide-react";
import { createConversation } from "../../api/messaging";

const handleMessageProvider = async (service) => {
  try {
    await createConversation(service.provider_id, service.service_offering_id);
    navigate("/customer/messages");
  } catch (error) {
    if (error.status === 409) {
      navigate("/customer/messages"); // Conversation exists, go anyway
    } else {
      alert("Failed to start conversation");
    }
  }
};

// In render:
<Button onClick={() => handleMessageProvider(service)} variant="outline">
  <MessageSquare className="h-4 w-4" />
</Button>
```

#### Bookings.jsx - Message Provider Button

Similar implementation with booking data:
```javascript
<Button onClick={() => handleMessageProvider(booking)} variant="outline">
  <MessageSquare className="h-4 w-4" />
  Message
</Button>
```

### 6. Dashboard Integration

**Messages Card with Unread Indicator:**
```javascript
const [totalUnread, setTotalUnread] = useState(0);

// Fetch unread count with polling
useEffect(() => {
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 30000);
  return () => clearInterval(interval);
}, []);

// Card displays:
// - Unread badge when totalUnread > 0
// - Dynamic text: "You have new messages" vs "Chat with providers"
// - Button: "View Messages" vs "Open Messages"
```

---

## Service Provider Implementation Guide

### Step 1: Create Provider API Layer

**File:** `src/api/messagingProvider.js`

```javascript
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "./config";

/**
 * Get authentication token from AWS Amplify (for providers)
 */
async function getAuthToken() {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
    throw new Error("User not authenticated");
  }

  return token;
}

/**
 * Get all conversations for provider
 */
export async function getConversations(limit = 20) {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/messages/conversations?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch conversations");
  return data;
}

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
  if (!res.ok) throw new Error(data.message || "Failed to send message");
  return data;
}

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
  if (!res.ok) throw new Error(data.message || "Failed to fetch messages");
  return data;
}

export async function markConversationAsRead(conversationId) {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}/read`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to mark as read");
  return data;
}
```

**Key Difference from Customer:**
- Uses `fetchAuthSession()` from `aws-amplify/auth` (async)
- All functions are `async` because token retrieval is async

### Step 2: Create Provider Messages Page

**File:** `src/pages/ServiceProvider/Messages.jsx`

```javascript
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import ConversationList from "../../components/messaging/ConversationList";
import MessageThread from "../../components/messaging/MessageThread";
import MessageInput from "../../components/messaging/MessageInput";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from "../../api/messagingProvider"; // Note: messagingProvider.js

export default function ProviderMessages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessagesForConversation(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  async function loadConversations() {
    try {
      setError(null);
      const data = await getConversations(50);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessagesForConversation(conversationId) {
    try {
      setLoadingMessages(true);
      setError(null);

      const data = await getMessages(conversationId, 100);
      setMessages(data.messages || []);

      await markConversationAsRead(conversationId);

      setConversations(prev =>
        prev.map(conv =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);
  }

  async function handleSendMessage(text) {
    if (!selectedConversation || !text.trim()) return;

    try {
      setSendingMessage(true);
      setError(null);

      const sentMessage = await sendMessage(selectedConversation.conversationId, text);
      setMessages(prev => [...prev, sentMessage]);
      loadConversations(); // Refresh to update preview
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-neutral-100">
      {/* Left Sidebar - Conversations (30%) */}
      <div className="w-[30%] min-w-[300px] border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 bg-white px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
          {conversations.length > 0 && (
            <p className="mt-1 text-sm text-neutral-500">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelect={handleSelectConversation}
          loading={loadingConversations}
        />
      </div>

      {/* Right Panel - Messages (70%) */}
      <div className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            <div className="border-b border-neutral-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {selectedConversation.otherUser.name}
              </h2>
              {selectedConversation.jobTitle && (
                <p className="mt-1 text-sm text-neutral-500">
                  Job: {selectedConversation.jobTitle}
                </p>
              )}
            </div>

            {error && (
              <div className="border-b border-red-200 bg-red-50 px-6 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <MessageThread messages={messages} loading={loadingMessages} />
            <MessageInput onSend={handleSendMessage} disabled={sendingMessage} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50">
            <MessageSquare className="h-16 w-16 text-neutral-300" />
            <h3 className="mt-4 text-lg font-medium text-neutral-600">
              Select a conversation
            </h3>
            <p className="mt-2 text-sm text-neutral-400">
              Choose a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Add Route

**File:** `src/App.jsx`

```javascript
import ProviderMessages from "./pages/ServiceProvider/Messages";

// In provider routes section:
<Route path="/service-provider" element={<ServiceProviderLayout />}>
  <Route path="messages" element={<ProviderMessages />} />
  {/* ... other routes */}
</Route>
```

### Step 4: Update Provider Navigation

**File:** `src/components/navigation/ServiceProviderTopNav.jsx` (or similar)

```javascript
import { useState, useEffect } from "react";
import UnreadBadge from "../messaging/UnreadBadge";
import { getConversations } from "../../api/messagingProvider";

export default function ServiceProviderNav() {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const data = await getConversations(50);
      const total = data.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setTotalUnread(total);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }

  return (
    // ... navigation
    <NavLink to="/service-provider/messages">
      <MessageSquare className="h-4 w-4" />
      Messages
      {totalUnread > 0 && <UnreadBadge count={totalUnread} />}
    </NavLink>
  );
}
```

### Step 5: Add Message Buttons to Provider Pages

**Example: Job Applications Page**

```javascript
import { MessageSquare } from "lucide-react";
import { createConversation } from "../../api/messagingProvider";

const handleMessageCustomer = async (application) => {
  try {
    await createConversation(
      application.customer_id,
      application.job_id
    );
    navigate("/service-provider/messages");
  } catch (error) {
    if (error.status === 409) {
      navigate("/service-provider/messages");
    } else {
      alert("Failed to start conversation");
    }
  }
};

// In render:
<Button onClick={() => handleMessageCustomer(application)} variant="outline">
  <MessageSquare className="h-4 w-4" />
  Message Customer
</Button>
```

### Step 6: Update Provider Dashboard

Similar to customer dashboard - add Messages card with unread indicator.

---

## Shared Components

All components in `src/components/messaging/` are **shared** between customer and provider:

- ✅ `UnreadBadge.jsx` - Works for both
- ✅ `MessageInput.jsx` - Works for both
- ✅ `MessageThread.jsx` - Works for both (uses auth context to identify current user)
- ✅ `ConversationList.jsx` - Works for both

**No modifications needed!**

---

## Testing Guide

### Manual Testing Checklist

**Customer Side (Already Implemented):**
- [x] Can view conversations list
- [x] Can select and view messages
- [x] Can send messages
- [x] Messages auto-refresh
- [x] Unread count shows in nav
- [x] Can create conversation from ServiceList
- [x] Can create conversation from Bookings
- [x] Dashboard shows unread messages

**Provider Side (To Be Implemented):**
- [ ] Can view conversations list
- [ ] Can select and view messages
- [ ] Can send messages
- [ ] Messages auto-refresh
- [ ] Unread count shows in nav
- [ ] Can create conversation from job applications
- [ ] Dashboard shows unread messages

### Test Scenarios

1. **Create Conversation:**
   - Customer clicks "Message" on service → creates conversation
   - Provider sees new conversation in their list

2. **Send Messages:**
   - Customer sends message → Provider receives it
   - Provider sends reply → Customer receives it

3. **Unread Counts:**
   - Unread count increases when new message received
   - Unread count resets when conversation opened

4. **Real-time Updates:**
   - Messages appear within 10 seconds (polling interval)
   - Unread counts update within 30 seconds

5. **Error Handling:**
   - Creating duplicate conversation navigates to messages
   - Failed API calls show error messages

---

## Key Differences: Customer vs Provider

| Aspect | Customer | Provider |
|--------|----------|----------|
| **Auth Method** | `react-oidc-context` | `aws-amplify/auth` |
| **Token Source** | localStorage (OIDC) | `fetchAuthSession()` |
| **API File** | `messaging.js` | `messagingProvider.js` |
| **Token Retrieval** | Synchronous | Asynchronous |
| **Navigation** | `/customer/messages` | `/service-provider/messages` |
| **User ID Field** | `auth.user.profile.sub` | `auth.user.userId` (check your auth) |

---

## Implementation Checklist for Provider

### Phase 1: API Layer
- [ ] Create `src/api/messagingProvider.js`
- [ ] Implement `getAuthToken()` using AWS Amplify
- [ ] Implement all 5 API functions
- [ ] Test API functions in console

### Phase 2: Main Messages Page
- [ ] Create `src/pages/ServiceProvider/Messages.jsx`
- [ ] Copy structure from customer Messages.jsx
- [ ] Update imports to use `messagingProvider.js`
- [ ] Add route in App.jsx

### Phase 3: Navigation
- [ ] Add Messages link to provider nav
- [ ] Add unread badge with polling
- [ ] Test navigation

### Phase 4: Entry Points
- [ ] Add message buttons to job applications page
- [ ] Add message buttons to bookings page (if applicable)
- [ ] Test conversation creation

### Phase 5: Dashboard
- [ ] Add Messages card to provider dashboard
- [ ] Add unread count indicator
- [ ] Test polling and updates

### Phase 6: Testing
- [ ] End-to-end messaging between customer and provider
- [ ] Unread count tracking
- [ ] Real-time updates
- [ ] Error handling

---

## Support and Questions

For questions or issues:
1. Check the customer implementation as reference
2. Review the backend API documentation above
3. Test API calls in browser console first
4. Check authentication token is present

---

## File Locations Reference

### Customer Files (Reference)
```
src/api/messaging.js
src/components/messaging/*.jsx
src/pages/customer/Messages.jsx
src/pages/customer/Dashboard.jsx (updated)
src/pages/customer/ServiceList.jsx (updated)
src/pages/customer/Bookings.jsx (updated)
src/components/navigation/CustomerNav.jsx (updated)
```

### Provider Files (To Create)
```
src/api/messagingProvider.js                    ← CREATE
src/pages/ServiceProvider/Messages.jsx          ← CREATE
src/pages/ServiceProvider/Dashboard.jsx         ← UPDATE
src/components/navigation/ProviderNav.jsx       ← UPDATE
src/pages/ServiceProvider/[YourPages].jsx       ← UPDATE (add message buttons)
```

---

**Document Version:** 1.0
**Last Updated:** January 6, 2026
**Status:** Customer implementation complete, Provider implementation guide ready
