# Agent Panel Frontend - Complete System Overview

> **Last Updated:** December 8, 2025  
> **Project:** WhatsApp Chatbot Agent Panel (Twilio Studio Integration)  
> **Status:** Production-ready with identified improvement areas

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Component Structure](#component-structure)
5. [State Management Strategy](#state-management-strategy)
6. [Backend Integration](#backend-integration)
7. [Real-Time Updates](#real-time-updates)
8. [UX Strengths](#ux-strengths)
9. [Current Issues & Limitations](#current-issues--limitations)
10. [Improvement Opportunities](#improvement-opportunities)
11. [Decisions & Actions Required](#decisions--actions-required)

---

## Executive Summary

The Agent Panel is a **React 19 + TypeScript** single-page application (SPA) that enables customer service agents to manage conversations handed off from a WhatsApp chatbot built with Twilio Studio. The frontend provides real-time message management, conversation assignment, and workflow status tracking with full internationalization (English/Hebrew with RTL support).

### Key Characteristics

- **Framework:** React 19.2.0 with functional components and hooks
- **Build Tool:** Vite 7.2.4 for fast development and optimized production builds
- **Styling:** Tailwind CSS v4 with custom brand colors and RTL support
- **State Management:** TanStack Query v5 for server state, React Context for auth
- **Real-Time:** Socket.IO v4.8.1 for bidirectional communication
- **Routing:** React Router v7 with protected routes
- **i18n:** react-i18next with English and Hebrew locales
- **Deployment:** Vercel with SPA configuration

---

## Tech Stack & Architecture

### Core Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "typescript": "~5.9.3",
  "vite": "^7.2.4",
  "tailwindcss": "^4.1.17",
  "@tanstack/react-query": "^5.90.10",
  "socket.io-client": "^4.8.1",
  "react-router-dom": "^7.9.6",
  "react-i18next": "^16.3.5",
  "axios": "^1.13.2",
  "date-fns": "^4.1.0"
}
```

### Architecture Pattern

**Client-Side MVC with React Query as Data Layer**

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Components (View Layer)              │  │
│  │  • LoginPage, DashboardPage                          │  │
│  │  • ConversationList, ConversationView                │  │
│  │  • MessageList, MessageInput                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │         React Query (State Management)               │  │
│  │  • Query Cache (conversations, messages)             │  │
│  │  • Mutations (send, close, assign, update)           │  │
│  │  • Automatic refetching and invalidation             │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │              API Layer (Axios)                       │  │
│  │  • authApi.ts (login, getMe)                         │  │
│  │  • agentApi.ts (conversations, messages, actions)    │  │
│  │  • Interceptors (auth token, error handling)         │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│                          │ HTTP                              │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    Backend API Server                        │
│  • REST endpoints (auth, conversations, messages)            │
│  • JWT authentication                                        │
│  • Business logic (workflow, assignments)                    │
└──────────────────────────────────────────────────────────────┘
                           ▲
                           │ Socket.IO
┌──────────────────────────┼───────────────────────────────────┐
│                    Socket.IO Events                          │
│  • conversation:new → New conversation created               │
│  • conversation:updated → Status/assignment changed          │
│  • message:new → New message in any conversation             │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Authentication Flow

```
┌──────────────┐
│  LoginPage   │
└──────┬───────┘
       │ 1. Submit credentials
       ▼
┌──────────────────────┐
│  POST /auth/login    │
└──────┬───────────────┘
       │ 2. Return JWT + agent info
       ▼
┌──────────────────────────────┐
│  Store token in localStorage │
└──────┬───────────────────────┘
       │ 3. Initialize socket with token
       ▼
┌────────────────────────────────┐
│  Socket.IO connect(auth: {token}) │
└──────┬─────────────────────────┘
       │ 4. Navigate to /dashboard
       ▼
┌──────────────────┐
│  DashboardPage   │
└──────────────────┘
```

### Conversation List Flow

```
┌─────────────────────┐
│  ConversationList   │
└──────┬──────────────┘
       │ 1. Mount component
       ▼
┌──────────────────────────────────────┐
│  useConversations({ status: 'open', │
│    workflowStatus?, mine?, agentId?})│
└──────┬───────────────────────────────┘
       │ 2. React Query checks cache
       ▼
┌───────────────────────────────────────┐
│  Cache miss? Call API                 │
│  GET /agent/conversations?params      │
└──────┬────────────────────────────────┘
       │ 3. Transform & cache response
       ▼
┌──────────────────────────────────────────┐
│  Render ConversationListItem components  │
│  • Display name, last message, time      │
│  • Unread badge, workflow status         │
│  • Assigned agent, context info          │
└──────┬───────────────────────────────────┘
       │ 4. User clicks conversation
       ▼
┌────────────────────────────────┐
│  setActiveConversationId(id)   │
│  → Renders ConversationView    │
└────────────────────────────────┘
```

### Message Send Flow

```
┌─────────────────┐
│  MessageInput   │
└──────┬──────────┘
       │ 1. User types and presses Enter
       ▼
┌──────────────────────────────────┐
│  useSendMessage().mutate({       │
│    conversationId, text          │
│  })                              │
└──────┬───────────────────────────┘
       │ 2. Optimistic update
       │    • Set unreadCount = 0
       │    • lastMessageDirection = 'outbound'
       ▼
┌────────────────────────────────────┐
│  POST /agent/conversations/:id/reply │
│  Body: { text }                    │
└──────┬─────────────────────────────┘
       │ 3. API success
       ▼
┌─────────────────────────────────────┐
│  Invalidate queries:                │
│  • ['messages', conversationId]     │
│  • ['conversations']                │
└──────┬──────────────────────────────┘
       │ 4. Background refetch
       ▼
┌─────────────────────────────┐
│  UI reflects actual state   │
└─────────────────────────────┘
```

### Real-Time Update Flow

```
┌────────────────────────┐
│  Backend Event Occurs  │
│  (new message received)│
└──────┬─────────────────┘
       │ 1. Emit socket event
       ▼
┌──────────────────────────────────┐
│  Socket.IO Event: message:new    │
│  { conversationId, direction,    │
│    message }                     │
└──────┬───────────────────────────┘
       │ 2. socketClient listener
       ▼
┌────────────────────────────────────────┐
│  queryClient.invalidateQueries({       │
│    queryKey: ['messages', convId]      │
│  })                                    │
└──────┬─────────────────────────────────┘
       │ 3. React Query refetches
       ▼
┌──────────────────────────────────────────┐
│  useMessages hook returns fresh data     │
└──────┬───────────────────────────────────┘
       │ 4. Component re-renders
       ▼
┌──────────────────────────────┐
│  New message appears in UI   │
│  Unread count updates        │
└──────────────────────────────┘
```

---

## Component Structure

### File Organization

```
src/
├── api/                          # API client layer
│   ├── client.ts                 # Axios instance with auth interceptor
│   ├── authApi.ts                # POST /auth/login, GET /auth/me
│   └── agentApi.ts               # Conversation & message endpoints
│
├── components/
│   ├── common/                   # Reusable UI components
│   │   ├── LanguageSwitcher.tsx  # EN/HE toggle with RTL switch
│   │   └── LoadingSpinner.tsx    # Animated spinner
│   │
│   ├── conversations/            # Conversation management
│   │   ├── ConversationList.tsx          # Left panel list
│   │   ├── ConversationListItem.tsx      # Individual row
│   │   ├── ConversationView.tsx          # Right panel detail
│   │   ├── ConversationActionsMenu.tsx   # Combined assign + status menu
│   │   ├── ConversationAssignmentMenu.tsx# Standalone assign menu (deprecated?)
│   │   └── WorkflowStatusBadge.tsx       # Status pill component
│   │
│   ├── layout/                   # Layout wrappers
│   │   ├── DashboardLayout.tsx   # Header + content wrapper
│   │   └── Header.tsx            # Top nav with logo, agent, logout
│   │
│   └── messages/                 # Message display
│       ├── MessageList.tsx       # Scrollable container
│       ├── MessageBubble.tsx     # Individual message with collapsible text
│       └── MessageInput.tsx      # Send input field
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.tsx               # AuthProvider + useAuth hook
│   ├── useConversations.ts       # All data fetching hooks
│   └── useSocket.ts              # Socket event listener wrapper
│
├── i18n/                         # Internationalization
│   ├── index.ts                  # i18next config
│   └── locales/
│       ├── en/common.json        # English translations
│       └── he/common.json        # Hebrew translations
│
├── pages/                        # Route pages
│   ├── LoginPage.tsx             # Authentication form
│   └── DashboardPage.tsx         # Main agent workspace
│
├── router/                       # Routing configuration
│   ├── AppRouter.tsx             # Route definitions
│   └── ProtectedRoute.tsx        # Auth guard HOC
│
├── services/                     # Singleton services
│   └── socketClient.ts           # Socket.IO client wrapper
│
├── types/                        # TypeScript definitions
│   ├── agent.ts                  # Agent, LoginResponse
│   ├── conversation.ts           # Conversation, WorkflowStatus
│   └── message.ts                # Message interface
│
├── utils/                        # Utility functions
│   └── unreadCounter.ts          # computeUnreadCount logic
│
├── App.tsx                       # Root component with providers
├── main.tsx                      # Entry point
└── index.css                     # Global styles + Tailwind imports
```

### Component Hierarchy

```
App
└── QueryClientProvider
    └── AuthProvider
        └── AppRouter (BrowserRouter)
            ├── Route: /login
            │   └── LoginPage
            │       ├── LanguageSwitcher
            │       └── LoadingSpinner (on submit)
            │
            ├── Route: /dashboard (Protected)
            │   └── DashboardLayout
            │       ├── Header
            │       │   ├── Logo + Title
            │       │   ├── LanguageSwitcher
            │       │   ├── Agent Info (name + online badge)
            │       │   └── Logout Button
            │       │
            │       └── DashboardPage
            │           ├── ConversationList (left panel)
            │           │   ├── Filter Bar (Open, New, In Progress, etc.)
            │           │   ├── "Show only my conversations" Toggle
            │           │   └── ConversationListItem (multiple)
            │           │       ├── Display Name
            │           │       ├── Last Message Preview
            │           │       ├── Timestamp
            │           │       ├── WorkflowStatusBadge
            │           │       ├── Assigned Agent Badge
            │           │       ├── Unread Count Badge
            │           │       └── ConversationActionsMenu (3-dots)
            │           │
            │           └── ConversationView (right panel)
            │               ├── Header
            │               │   ├── Customer Info
            │               │   ├── Assigned Agent Display
            │               │   ├── WorkflowStatusBadge + Edit Dropdown
            │               │   ├── ConversationActionsMenu (3-dots)
            │               │   └── Close Button
            │               │
            │               ├── MessageList
            │               │   └── MessageBubble (multiple)
            │               │       ├── Text (with URL linkification)
            │               │       ├── Timestamp
            │               │       └── Checkmark (outbound only)
            │               │
            │               └── MessageInput (or "Closed" message)
            │
            └── Route: / → Navigate to /dashboard
```

---

## State Management Strategy

### React Query (TanStack Query) for Server State

**Configuration (App.tsx):**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Don't refetch on tab focus
      retry: 1,                      // Retry failed requests once
    },
  },
});
```

**Query Keys Structure:**
```typescript
// Conversations
['conversations', { status, workflowStatus, mine, agentId }]

// Single conversation
['conversation', conversationId]

// Messages
['messages', conversationId]

// Agents list
['agents']
```

**Data Fetching Hooks (useConversations.ts):**

| Hook | Purpose | Query Key | API Endpoint |
|------|---------|-----------|--------------|
| `useConversations(filter)` | Fetch conversation list | `['conversations', {...filter}]` | `GET /agent/conversations` |
| `useConversation(id)` | Fetch single conversation | `['conversation', id]` | `GET /agent/conversations/:id` |
| `useMessages(conversationId)` | Fetch messages | `['messages', conversationId]` | `GET /agent/conversations/:id/messages` |
| `useAgents()` | Fetch all agents | `['agents']` | `GET /agent/agents` |
| `useSendMessage()` | Send message mutation | N/A | `POST /agent/conversations/:id/reply` |
| `useCloseConversation()` | Close conversation | N/A | `PATCH /agent/conversations/:id/close` |
| `useAssignConversation()` | Assign/unassign | N/A | `PATCH /agent/conversations/:id/assign` |
| `useUpdateWorkflowStatus()` | Update workflow | N/A | `PATCH /agent/conversations/:id/workflow-status` |

### React Context for Client State

**AuthProvider (useAuth.tsx):**
```typescript
interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

- Stores JWT token in `localStorage` (key: `'token'`)
- Provides current agent info to all components
- Handles socket connection/disconnection
- Auto-initializes on app load by calling `GET /auth/me`

---

## Backend Integration

### API Client Configuration

**Axios Instance (api/client.ts):**
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints

#### Authentication (authApi.ts)

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| POST | `/auth/login` | `{ email, password }` | `{ success, token, agent }` | Authenticate agent |
| GET | `/auth/me` | N/A | `{ success, agent }` | Get current agent profile |

#### Agent Operations (agentApi.ts)

| Method | Endpoint | Query Params | Body | Response | Description |
|--------|----------|--------------|------|----------|-------------|
| GET | `/agent/conversations` | `status, workflowStatus, mine, agentId, page, pageSize` | N/A | `{ success, items[], total, page, pageSize }` | List conversations |
| GET | `/agent/conversations/:id` | N/A | N/A | `{ success, conversation }` | Get single conversation |
| GET | `/agent/conversations/:id/messages` | `limit, before` | N/A | `{ success, messages[] }` | Get messages |
| POST | `/agent/conversations/:id/reply` | N/A | `{ text }` | `{ success, message }` | Send message |
| PATCH | `/agent/conversations/:id/close` | N/A | N/A | `{ success }` | Close conversation |
| PATCH | `/agent/conversations/:id/assign` | N/A | `{ agentId: string \| null }` | `{ success, conversation }` | Assign/unassign |
| PATCH | `/agent/conversations/:id/workflow-status` | N/A | `{ workflowStatus }` | `{ success, conversation }` | Update workflow |
| GET | `/agent/agents` | N/A | N/A | `Agent[]` | List all active agents |

### Data Transformation

**Backend → Frontend Mapping (agentApi.ts):**

```typescript
function transformConversation(rawData: any): Conversation {
  return {
    id: rawData.id || rawData._id,
    customerId: rawData.customer_id || rawData.customerId,
    customerPhone: rawData.customer_phone || rawData.customerPhone,
    userPhone: rawData.user_phone || rawData.userPhone,
    displayName: rawData.display_name || rawData.displayName,
    userName: rawData.user_name || rawData.userName,
    status: rawData.status,
    workflowStatus: rawData.workflow_status || rawData.workflowStatus,
    context: transformContext(rawData.context),
    lastMessageAt: rawData.last_message_at || rawData.lastMessageAt,
    createdAt: rawData.created_at || rawData.createdAt,
    updatedAt: rawData.updated_at || rawData.updatedAt,
    unreadCount: rawData.unread_count ?? rawData.unreadCount ?? 0,
    lastMessage: rawData.last_message || rawData.lastMessage,
    lastMessageDirection: rawData.last_message_direction || rawData.lastMessageDirection,
    assignedAgent: rawData.assigned_agent || rawData.assignedAgent,
  };
}
```

**Supports both snake_case and camelCase from backend.**

---

## Real-Time Updates

### Socket.IO Integration

**Connection (socketClient.ts):**
```typescript
const socket = io(VITE_SOCKET_URL || 'http://localhost:3000', {
  auth: { token },
  autoConnect: true,
});
```

**Event Listeners:**

| Event | Expected Payload | Action | Side Effects |
|-------|------------------|--------|--------------|
| `connect` | N/A | Log connection ID | None |
| `disconnect` | `reason` | Log reason | None |
| `connect_error` | `error` | Log error | None |
| `conversation:new` | `{ ...Conversation }` | Invalidate `['conversations', 'open']` | List refreshes |
| `conversation:updated` | `{ conversationId, ...fields }` | Invalidate `['conversations']` + `['conversation', id]` | Detail & list refresh |
| `message:new` | `{ conversationId, direction, message }` | Invalidate `['messages', id]` + `['conversations']` | Messages & list refresh |

**Cache Invalidation Strategy:**
- **Optimistic Updates:** Mutations update cache immediately before API response
- **Background Refetch:** `invalidateQueries` triggers background refetch
- **Stale Time:** Default 0 (immediate staleness), relies on manual invalidation

### Unread Count Synchronization

**Logic (utils/unreadCounter.ts):**
```typescript
export function computeUnreadCount(messages: Message[]): number {
  // Find last outbound (agent) message
  const lastOutboundIndex = messages
    .slice()
    .reverse()
    .findIndex((m) => m.direction === 'outbound');

  // If no outbound message, return 0 (agent hasn't replied yet)
  if (lastOutboundIndex === -1) {
    return 0;
  }

  // Count inbound messages after last outbound
  const lastOutboundPosition = messages.length - 1 - lastOutboundIndex;
  const inboundAfter = messages.slice(lastOutboundPosition + 1)
    .filter((m) => m.direction === 'inbound');

  return inboundAfter.length;
}
```

**Sync Points:**
1. **On conversation open:** `ConversationView` computes count from messages
2. **On message send:** Optimistically set to 0
3. **On socket event:** Refetch messages, recompute count

---

## UX Strengths

### ✅ What Works Well

1. **Real-Time Responsiveness**
   - Socket.IO provides instant updates across all connected clients
   - React Query cache invalidation ensures data consistency
   - Optimistic updates make sending messages feel instant

2. **Internationalization (i18n)**
   - Full English and Hebrew support
   - Automatic RTL layout switching
   - All UI text properly translated
   - Context-aware element positioning (`ltr:` and `rtl:` Tailwind classes)

3. **Visual Design**
   - Modern, clean interface with brand colors
   - Consistent design system (shadows, borders, spacing)
   - Clear visual hierarchy
   - Professional appearance suitable for enterprise

4. **Conversation Management**
   - Easy assignment of conversations (self or others)
   - Workflow status tracking with color-coded badges
   - Filter bar for quick conversation segmentation
   - "Show only my conversations" toggle for focus

5. **Message Display**
   - Clear distinction between inbound/outbound messages
   - URL linkification (clickable links)
   - Collapsible long messages (>260 chars)
   - Auto-scroll to latest message

6. **Developer Experience**
   - TypeScript provides type safety
   - Well-organized file structure
   - Reusable components
   - Clear separation of concerns (API, hooks, components)

---

## Current Issues & Limitations

### 🚨 Critical Issues

1. **Unread Count Inconsistency**
   - **Problem:** Both frontend and backend compute unread count, causing potential mismatches
   - **Impact:** Agents may see incorrect unread badges
   - **Location:** `utils/unreadCounter.ts`, `ConversationView.tsx` (lines 29-60)
   - **Recommendation:** Establish single source of truth (backend preferred)

2. **No Pagination**
   - **Problem:** Hardcoded limits (50 conversations, 100 messages)
   - **Impact:** Performance degradation with high-volume agents
   - **Location:** `useConversations.ts` (line 23), `useMessages.ts` (line 39)
   - **Recommendation:** Implement infinite scroll or cursor-based pagination

3. **Minimal Error Handling**
   - **Problem:** API failures show no user-friendly error messages
   - **Impact:** Poor UX when backend is down or network fails
   - **Location:** All mutation hooks (no `onError` UI feedback)
   - **Recommendation:** Add toast notifications or inline error displays

4. **Socket Disconnect UX**
   - **Problem:** No visual indicator when socket disconnects
   - **Impact:** Agents may miss messages without realizing connection is lost
   - **Location:** `socketClient.ts` (only logs to console)
   - **Recommendation:** Add connection status banner

### ⚠️ Moderate Issues

5. **Multi-Tab Behavior Undefined**
   - **Problem:** Multiple tabs connect independently, no coordination
   - **Impact:** Redundant socket connections, potential state drift
   - **Recommendation:** Implement tab synchronization (BroadcastChannel API)

6. **No Mark-as-Read Without Reply**
   - **Problem:** Unread count only clears when agent sends message
   - **Impact:** Agents can't mark conversations as "seen" without replying
   - **Recommendation:** Add explicit "Mark as Read" action

7. **Hard Refresh on Non-Root Routes**
   - **Problem:** Reloading `/dashboard` may fail if Vercel rewrite isn't configured
   - **Impact:** 404 errors on direct navigation
   - **Location:** `vercel.json` (rewrite rule exists, may need verification)
   - **Recommendation:** Test in production, ensure `vercel.json` is deployed

8. **React Query Cache Configuration**
   - **Problem:** `refetchOnWindowFocus: false` prevents fresh data on tab switch
   - **Impact:** Stale data when agents return to tab
   - **Location:** `App.tsx` (line 9)
   - **Recommendation:** Enable with appropriate `staleTime` (e.g., 30s)

### 🔧 Minor Issues

9. **Component Duplication**
   - **Problem:** Both `ConversationActionsMenu` and `ConversationAssignmentMenu` exist
   - **Impact:** Code duplication, maintenance burden
   - **Location:** `src/components/conversations/`
   - **Recommendation:** Deprecate `ConversationAssignmentMenu` if unused

10. **Documentation Version Mismatch**
    - **Problem:** README says React 18, but `package.json` has React 19
    - **Impact:** Developer confusion
    - **Recommendation:** Update README to match actual version

11. **TypeScript Strict Mode Disabled**
    - **Problem:** Loose type checking allows potential bugs
    - **Impact:** Runtime errors that could be caught at compile time
    - **Recommendation:** Enable incrementally with `// @ts-strict-ignore` for existing files

12. **No Virtualization for Long Lists**
    - **Problem:** 100+ messages render all DOM nodes
    - **Impact:** Potential scrolling performance issues
    - **Recommendation:** Use `react-window` or `react-virtuoso` for message lists

---

## Improvement Opportunities

### 🚀 High Priority (Short-Term)

1. **Implement Cursor-Based Pagination**
   - Add "Load More" buttons for conversations and messages
   - Update API calls to support `cursor` and `nextCursor` params
   - Estimated effort: 2-3 days

2. **Add Connection Status Indicator**
   - Show banner when socket disconnects
   - Display "Reconnecting..." state
   - Disable message input until reconnected
   - Estimated effort: 1 day

3. **Establish Unread Count Authority**
   - Decide: backend or frontend computes unread count
   - Remove redundant computation
   - Add explicit "Mark as Read" endpoint if backend-authoritative
   - Estimated effort: 1-2 days

4. **Improve Error UX**
   - Add toast notification library (e.g., `react-hot-toast`)
   - Show user-friendly error messages on mutations
   - Add "Retry" functionality for failed sends
   - Estimated effort: 2 days

5. **Enable React Query Window Focus Refetch**
   - Set `refetchOnWindowFocus: true` with `staleTime: 30000` (30s)
   - Ensure agents see fresh data when returning to tab
   - Estimated effort: 1 hour

### 🎯 Medium Priority (Mid-Term)

6. **Implement Browser Push Notifications**
   - Request permission on login
   - Show notifications for new messages (even when tab is backgrounded)
   - Add user preference to enable/disable
   - Estimated effort: 3-4 days

7. **Add Sound Alerts**
   - Play sound for new inbound messages
   - Configurable per-agent preference
   - Respect browser autoplay policies
   - Estimated effort: 1 day

8. **Multi-Tab Synchronization**
   - Use BroadcastChannel API to coordinate tabs
   - Logout in one tab → logout all tabs
   - Show "This tab is inactive" message in secondary tabs
   - Estimated effort: 2-3 days

9. **Implement Search Functionality**
   - Add search input above conversation list
   - Search by customer name, phone, plate, part description
   - Highlight matches in results
   - Estimated effort: 3-4 days

10. **Mobile UX Refinements**
    - Add back button in conversation header (mobile only)
    - Implement swipe gestures (swipe right to go back)
    - Bottom navigation for main actions
    - Estimated effort: 5-6 days

### 🌟 Low Priority (Long-Term)

11. **File Attachment Support**
    - Add image/document upload UI
    - Preview attachments in messages
    - Backend integration for file storage
    - Estimated effort: 1-2 weeks

12. **Typing Indicators**
    - Show "Customer is typing..." when customer types
    - Show "Agent X is typing..." to other agents
    - Socket event integration
    - Estimated effort: 2-3 days

13. **Quick Replies / Templates**
    - Predefined message templates
    - Keyboard shortcuts for common replies
    - Admin interface to manage templates
    - Estimated effort: 1 week

14. **Analytics Dashboard**
    - Agent performance metrics
    - Conversation funnel (new → won/lost)
    - Response time averages
    - Charts and graphs
    - Estimated effort: 2-3 weeks

15. **Customer History View**
    - Show past conversations with same customer
    - Order history (if integrated with e-commerce)
    - Notes and tags on customer profile
    - Estimated effort: 2 weeks

---

## Decisions & Actions Required

> **Purpose:** This section documents pending decisions that block implementation or optimization. Each item includes context, options, and recommended resolution.

### 🔴 Critical Decisions (Block Development)

#### D1: Production Environment URLs
**Status:** ❌ **NOT CONFIGURED**

**Context:**
- Frontend uses `VITE_API_BASE_URL` and `VITE_SOCKET_URL` environment variables
- No `.env` file exists in repository
- Default fallback: `http://localhost:3000` (unsuitable for production)

**Required Information:**
1. **Production API Base URL:** `https://api.example.com` or `https://backend.vercel.app`
2. **Staging API Base URL (if separate):** `https://staging-api.example.com`
3. **Same domain as frontend?** YES/NO
4. **If different domain, CORS origins whitelist:** List of allowed origins

**Action Items:**
- [ ] Provide production API URL
- [ ] Provide staging API URL (if applicable)
- [ ] Configure CORS in backend if different domains
- [ ] Create `.env.production` file with values
- [ ] Configure Vercel environment variables

**Owner:** Backend team + DevOps  
**Deadline:** Required before deployment

---

#### D2: Socket.IO Event Payloads
**Status:** ❌ **PAYLOAD SCHEMAS UNKNOWN**

**Context:**
- Frontend listens to 3 events but payload structure is inferred, not documented
- Current code expects specific fields but may fail if backend sends different structure

**Required Information:**

```typescript
// EXACT payload structures needed:

// Event: conversation:new
{
  // Provide actual JSON structure
  // Required vs optional fields?
}

// Event: conversation:updated
{
  conversationId: string;  // Confirmed required
  // What other fields? Full conversation or partial?
}

// Event: message:new
{
  conversationId: string;  // Confirmed required
  direction?: 'inbound' | 'outbound';
  message?: {
    // Structure of message object?
  };
  // Are direction and message both present?
}
```

**Additional Questions:**
1. **Auto-resubscribe on reconnect?** Should frontend re-subscribe to events after socket reconnects? (YES/NO)
2. **Multi-tab policy:** Allow multiple tabs per agent? (YES/NO)
   - If NO, what should happen in secondary tabs? (block login / show "active elsewhere" message)

**Action Items:**
- [ ] Backend team provides exact payload schemas
- [ ] Update `socketClient.ts` with payload type definitions
- [ ] Add payload validation (optional but recommended)

**Owner:** Backend team  
**Deadline:** Before implementing real-time features beyond basic invalidation

---

#### D3: Authentication & Session Management
**Status:** ⚠️ **PARTIAL INFORMATION**

**Context:**
- JWT tokens stored in `localStorage`
- No refresh token mechanism visible
- 401 responses trigger logout and redirect

**Required Information:**
1. **JWT expiry time:** How long before token expires? (minutes/hours)
2. **Refresh token available?** YES/NO
   - If YES, provide refresh endpoint: `POST /auth/refresh`?
3. **On token expiry:** Should frontend auto-refresh or force re-login?
4. **Multi-tab logout:** Log out in one tab → broadcast logout to others? (YES/NO)

**Action Items:**
- [ ] Clarify JWT expiry and refresh mechanism
- [ ] Implement token refresh if available
- [ ] Add BroadcastChannel for multi-tab logout sync if YES
- [ ] Add "Session expired" modal with re-login button

**Owner:** Backend team + Frontend team  
**Deadline:** Before production (security critical)

---

### 🟡 High-Priority Decisions (Impact UX)

#### D4: Unread Count Authority
**Status:** ❌ **CONFLICTING IMPLEMENTATIONS**

**Context:**
- Frontend computes unread count using `computeUnreadCount()` utility
- Backend may also send `unreadCount` field in conversation objects
- Both values may diverge, causing inconsistent UI

**Options:**
1. **Backend Authoritative (Recommended)**
   - Backend computes and sends `unreadCount`
   - Frontend displays value as-is
   - Add `POST /agent/conversations/:id/mark-read` endpoint for explicit read marking

2. **Frontend Authoritative**
   - Backend sends all messages
   - Frontend always computes count locally
   - Simpler backend, more client logic

**Questions:**
1. Does backend compute `unreadCount`? (YES/NO)
2. If YES, should frontend trust backend value? (YES/NO)
3. Should agents be able to mark conversations as read without replying? (YES/NO)
   - If YES, provide endpoint: `POST /agent/conversations/:id/mark-read`

**Action Items:**
- [ ] Choose authoritative source (backend recommended)
- [ ] If backend: ensure `unreadCount` is always sent
- [ ] If frontend: remove backend `unreadCount` field (if exists)
- [ ] Add mark-as-read endpoint if needed

**Owner:** Product + Backend + Frontend  
**Deadline:** Sprint 1

---

#### D5: Pagination Strategy
**Status:** ❌ **NOT IMPLEMENTED**

**Context:**
- Current limits: 50 conversations, 100 messages (hardcoded)
- No pagination UI
- Will fail at scale (1000+ conversations, long message threads)

**Required Information:**
1. **Target page sizes:** How many items per page?
   - Conversations: `20` / `50` / `100`?
   - Messages: `50` / `100` / `200`?

2. **Pagination style:** Cursor-based preferred? (YES/NO)
   - If YES, param names: `cursor`, `limit`, `nextCursor` (confirm)
   - If NO, use offset: `page`, `pageSize`

3. **UI pattern:** Infinite scroll or "Load more" button?

**Action Items:**
- [ ] Define page sizes
- [ ] Choose pagination type (cursor recommended for real-time data)
- [ ] Update API endpoints to support chosen pagination
- [ ] Implement frontend pagination UI

**Owner:** Product + Backend + Frontend  
**Deadline:** Sprint 2 (before high-volume testing)

---

#### D6: Error & Offline UX
**Status:** ❌ **MINIMAL ERROR HANDLING**

**Context:**
- No user-facing error messages for API failures
- Socket disconnects logged to console only
- Optimistic updates don't rollback on failure

**Questions:**
1. **On API failure when sending:** Keep optimistic bubble with "Retry" button? (YES/NO)
2. **On socket disconnect:** Show banner + disable input? (YES/NO)
3. **Global offline indicator:** Show "No connection" banner? (YES/NO)

**Action Items:**
- [ ] Decide on error UX patterns
- [ ] Add toast notification library (e.g., `react-hot-toast`)
- [ ] Implement connection status indicator
- [ ] Add retry logic for failed mutations

**Owner:** Frontend team + UX designer  
**Deadline:** Sprint 2

---

### 🟢 Medium-Priority Decisions (Optimize Experience)

#### D7: Workflow Transition Rules
**Status:** ⚠️ **NO VALIDATION**

**Context:**
- Workflow statuses: `new | in_progress | no_answer | won | lost`
- Agents can set: `in_progress`, `won`, `lost`
- No frontend validation of transitions

**Required Information:**
1. **Valid transitions:** List allowed state changes explicitly
   - Example: `new` → `in_progress` ✅, `won` → `new` ❌
2. **Who can close conversations?**
   - Assigned agent only?
   - Any agent?
   - Admin only?
3. **Can closed be reopened?** (YES/NO)
   - If YES, what's the new default status? (`new` / `in_progress`?)
4. **Assignment model:**
   - Auto-assign (specify algorithm: round-robin / load-based)?
   - Manual claim only?

**Action Items:**
- [ ] Document valid workflow transitions
- [ ] Add frontend validation in `ConversationActionsMenu.tsx`
- [ ] Implement close permission checks
- [ ] Clarify assignment algorithm

**Owner:** Product team  
**Deadline:** Sprint 3

---

#### D8: Internationalization Expansion
**Status:** ✅ **CURRENT: EN & HE**

**Context:**
- Currently supports English and Hebrew with full RTL
- i18n infrastructure ready for more languages

**Questions:**
1. **Supported locales now:** `en`, `he` (confirm)
2. **Any others in 2026 Q1?** (e.g., `ar`, `es`, `fr`)
3. **Date/time format:** DD/MM/YYYY or MM/DD/YYYY? 24h or 12h clock?

**Action Items:**
- [ ] Confirm current locales
- [ ] List planned locales with timeline
- [ ] Standardize date/time formatting (use `date-fns` with locale)

**Owner:** Product + Frontend  
**Deadline:** As needed

---

#### D9: Notifications & Alerts
**Status:** ❌ **NOT IMPLEMENTED**

**Questions:**
1. **Browser push for new inbound messages (permission-gated)?** (YES/NO)
2. **Sound alerts when tab is backgrounded?** (YES/NO)
3. **User preference controls?** Should agents be able to disable? (YES/NO)

**Action Items:**
- [ ] Decide on notification strategy
- [ ] Request browser notification permission on login (if YES)
- [ ] Add sound files to `public/` directory
- [ ] Add user preference toggle in settings

**Owner:** Product + Frontend  
**Deadline:** Sprint 4

---

### 🔵 Technical Baseline Decisions

#### D10: React Version Standardization
**Status:** ⚠️ **DOCUMENTATION MISMATCH**

**Current State:**
- `package.json`: React **19.2.0**
- `README.md`: States React **18**

**Question:** Standardize on React 18 or 19?

**Recommendation:** Keep React 19 (already using it, no issues observed)

**Action Items:**
- [ ] Update `README.md` to reflect React 19
- [ ] Update `IMPLEMENTATION_SUMMARY.md` to reflect React 19

**Owner:** Frontend team  
**Deadline:** Next documentation update

---

#### D11: TypeScript Strict Mode
**Status:** ❌ **DISABLED**

**Context:**
- `tsconfig.json` does not have `"strict": true`
- Allows loose type checking, potential runtime bugs

**Question:** Enable TypeScript strict mode now? (YES/NO)

**Options:**
1. **Enable now:** May reveal many errors, requires fixing
2. **Enable incrementally:** Add `// @ts-strict-ignore` to existing files, strict for new files
3. **Keep disabled:** Maintain current loose typing

**Recommendation:** Option 2 (incremental) - strict for new code, gradual migration

**Action Items:**
- [ ] Decide on approach
- [ ] If incremental: Update `tsconfig.json` with `strict: true`
- [ ] Add `// @ts-strict-ignore` to existing files

**Owner:** Frontend team  
**Deadline:** Sprint 5

---

#### D12: Message List Virtualization
**Status:** ❌ **NOT IMPLEMENTED**

**Context:**
- Current limit: 100 messages rendered as full DOM nodes
- May cause scroll performance issues with long threads

**Question:** Adopt virtualization (react-window)? (YES/NO)

**Recommendation:** YES if message threads exceed 200 messages regularly, NO if typical threads are <100 messages

**Action Items:**
- [ ] Measure typical message thread lengths in production
- [ ] If YES: Integrate `react-window` or `react-virtuoso`
- [ ] Test scrolling performance before/after

**Owner:** Frontend team  
**Deadline:** After production metrics available

---

### 📋 Decision Summary Table

| ID | Decision | Status | Priority | Blocks | Owner | Deadline |
|----|----------|--------|----------|--------|-------|----------|
| D1 | Production URLs | ❌ | 🔴 Critical | Deployment | Backend + DevOps | Pre-deploy |
| D2 | Socket Payloads | ❌ | 🔴 Critical | Real-time features | Backend | Sprint 1 |
| D3 | Auth & Session | ⚠️ | 🔴 Critical | Security | Backend + Frontend | Pre-deploy |
| D4 | Unread Authority | ❌ | 🟡 High | UX consistency | Product + Backend + Frontend | Sprint 1 |
| D5 | Pagination | ❌ | 🟡 High | Scalability | Product + Backend + Frontend | Sprint 2 |
| D6 | Error UX | ❌ | 🟡 High | User experience | Frontend + UX | Sprint 2 |
| D7 | Workflow Rules | ⚠️ | 🟢 Medium | Business logic | Product | Sprint 3 |
| D8 | i18n Expansion | ✅ | 🟢 Medium | None | Product + Frontend | As needed |
| D9 | Notifications | ❌ | 🟢 Medium | Agent productivity | Product + Frontend | Sprint 4 |
| D10 | React Version | ⚠️ | 🔵 Tech | Documentation | Frontend | Next doc update |
| D11 | TS Strict Mode | ❌ | 🔵 Tech | Code quality | Frontend | Sprint 5 |
| D12 | Virtualization | ❌ | 🔵 Tech | Performance | Frontend | Post-metrics |

---

### 📝 Next Steps

**Immediate Actions (This Week):**
1. ✅ Review this document with all stakeholders
2. ⏳ Product team: Answer D1, D2, D3 (critical blockers)
3. ⏳ Backend team: Provide socket payload schemas (D2)
4. ⏳ DevOps: Confirm production URLs and CORS config (D1)

**Sprint Planning:**
- **Sprint 1:** Resolve D1-D4, implement pagination foundation
- **Sprint 2:** Implement D5-D6, improve error handling
- **Sprint 3:** Implement D7, add workflow validation
- **Sprint 4:** Implement D9, add notifications

**Documentation Maintenance:**
- Update this section as decisions are made
- Mark items ✅ when resolved
- Add implementation notes and links to PRs

---

## Appendix

### A. Environment Variables

**Required Environment Variables:**
```bash
# .env.production
VITE_API_BASE_URL=https://api.partscanner.co.il
VITE_SOCKET_URL=https://api.partscanner.co.il

# .env.staging (if applicable)
VITE_API_BASE_URL=https://staging-api.partscanner.co.il
VITE_SOCKET_URL=https://staging-api.partscanner.co.il

# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### B. Default Login Credentials (Development)

```
Email: admin@partscanner.co.il
Password: changeme123
```

**⚠️ Change for production!**

### C. Key Files Reference

**Configuration:**
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Design system tokens
- `vercel.json` - Deployment settings (SPA rewrites)
- `tsconfig.json` - TypeScript configuration

**Entry Points:**
- `index.html` - HTML shell
- `src/main.tsx` - React app mount
- `src/App.tsx` - Root component with providers

**Core Logic:**
- `src/hooks/useAuth.tsx` - Authentication context
- `src/hooks/useConversations.ts` - Data fetching hooks
- `src/services/socketClient.ts` - Socket.IO client
- `src/api/client.ts` - Axios HTTP client

### D. Build & Deployment

**Development:**
```bash
npm run dev         # Start dev server (localhost:5173)
npm run build       # Production build
npm run preview     # Preview production build
```

**Production Build Output:**
- `dist/index.html` - Entry HTML
- `dist/assets/` - JS, CSS, images
- Gzipped size: ~137 KB JS + ~5 KB CSS

**Vercel Deployment:**
- Connected to GitHub repository
- Auto-deploy on push to `main` branch
- Environment variables configured in Vercel dashboard
- Custom domain: `agent-panel-part-scanner-bot.vercel.app`

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Next Review:** After decisions D1-D6 are resolved  
**Maintainer:** Frontend Team


