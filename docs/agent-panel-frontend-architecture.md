# Agent Panel Frontend Architecture Documentation

> **Last Updated:** December 3, 2025  
> **Purpose:** Complete frontend architecture documentation for the PartScanner Agent Panel  
> **Deployed at:** agent-panel-part-scanner-bot.vercel.app

---

## Table of Contents

1. [Conversation List & Layout](#1-conversation-list--layout)
2. [Routing & Pages](#2-routing--pages)
3. [State Management & Data Fetching](#3-state-management--data-fetching)
4. [Agent & Authentication Context](#4-agent--authentication-context)
5. [Socket / Live Updates](#5-socket--live-updates)
6. [Reusable UI Components](#6-reusable-ui-components)
7. [Current Limitations / Gotchas](#7-current-limitations--gotchas)

---

## 1. Conversation List & Layout

### Overview

The dashboard uses a **two-column split layout** with conversations on the left and the selected conversation detail on the right.

### Components

#### `DashboardPage.tsx`
- **Path:** `src/pages/DashboardPage.tsx`
- **Purpose:** Main dashboard page that orchestrates the layout
- **Key Features:**
  - Manages active conversation ID in local component state (`useState`)
  - Renders a flexbox layout with two panels:
    - Left: `ConversationList` (fixed width `w-96` on md+ screens)
    - Right: `ConversationView` (flex-1, hidden on mobile)
  - Displays an empty state (chat bubble icon + message) when no conversation is selected

#### `DashboardLayout.tsx`
- **Path:** `src/components/layout/DashboardLayout.tsx`
- **Purpose:** Wraps dashboard content with header
- **Structure:**
  - Full-height flexbox container with light gray background (`#F5F5F7`)
  - `Header` component at the top
  - `main` element with `flex-1 overflow-hidden` for the content area

#### `ConversationList.tsx`
- **Path:** `src/components/conversations/ConversationList.tsx`
- **Purpose:** Renders the list of conversations in the left sidebar
- **Key Features:**
  - Fetches conversations using `useConversations('open')` hook
  - Shows loading spinner, error state, or empty state based on data status
  - Header section shows title and conversation count
  - Scrollable list of `ConversationListItem` components
  - Currently hardcoded to show only **'open' status** conversations
  - No search or filter UI currently implemented

#### `ConversationListItem.tsx`
- **Path:** `src/components/conversations/ConversationListItem.tsx`
- **Purpose:** Individual conversation row in the list
- **Displays:**
  - Display name (priority: `displayName > userName > userPhone > customerPhone > customerId > 'Unknown'`)
  - Last message preview
  - Last message time (formatted with `date-fns` `formatDistanceToNow`)
  - Context info: plate number and part description as small badge tags
  - Unread count badge (red circle with number)
- **Visual States:**
  - Active: blue left border, light blue background (`#EFF6FF`)
  - Inactive: transparent, hover shows gray background
- **Unread Badge Logic:**
  - Only shows if `unreadCount > 0` AND (`lastMessageDirection === 'inbound'` OR direction is unknown)
  - This prevents showing unread count when agent just replied

#### `ConversationView.tsx`
- **Path:** `src/components/conversations/ConversationView.tsx`
- **Purpose:** Displays the selected conversation detail on the right side
- **Structure:**
  - Header section with customer info, context badges, and close button
  - `MessageList` component (scrollable messages area)
  - `MessageInput` component (or closed state message)
- **Key Features:**
  - Fetches conversation detail with `useConversation(conversationId)`
  - Fetches messages with `useMessages(conversationId)`
  - Computes and syncs unread count using `computeUnreadCount()` utility
  - Copy vehicle summary button (inside vehicle chip) - copies formatted string to clipboard
  - Close conversation functionality (with confirmation)
  - Disables input when conversation is closed

---

## 2. Routing & Pages

### Router Library

**React Router v7** (`react-router-dom@^7.9.6`)

### Main Routes

Defined in `src/router/AppRouter.tsx`:

| Path | Component | Protection | Description |
|------|-----------|-----------|-------------|
| `/login` | `LoginPage` | Public | Agent login page |
| `/dashboard` | `DashboardPage` | Protected | Main agent dashboard |
| `/` | Navigate to `/dashboard` | Redirect | Root redirects to dashboard |

### Route Protection

#### `ProtectedRoute.tsx`
- **Path:** `src/router/ProtectedRoute.tsx`
- **Purpose:** HOC that checks authentication before rendering protected routes
- **Logic:**
  - Uses `useAuth()` hook to check `token` and `isLoading` state
  - Shows loading spinner while checking auth
  - Redirects to `/login` if no token
  - Renders children if authenticated

### Entry Point

- **App.tsx:** Sets up providers (`QueryClientProvider` + `AuthProvider`) and renders `AppRouter`
- **main.tsx:** Standard React entry, renders `App` into `#root` DOM element

### Deployment Configuration

**Vercel SPA Configuration** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```
- Ensures all routes serve the main `index.html` for client-side routing
- **Known Issue:** Hard refresh on `/dashboard` or other routes may cause issues if this config is not properly applied (see "Gotchas" section)

---

## 3. State Management & Data Fetching

### State Management Strategy

**React Query (TanStack Query)** v5 is used for server state management. No global client state library (Redux, Zustand, etc.) is used. Local state is managed with React `useState` and `useContext`.

### Data Fetching Hooks

All data fetching logic is in `src/hooks/useConversations.ts`:

#### `useConversations(status)`
- **Purpose:** Fetches list of conversations
- **Query Key:** `['conversations', status]`
- **API Call:** `agentApi.getConversations({ status, page: 1, pageSize: 50 })`
- **Current Behavior:** Hardcoded to fetch first 50 conversations, no pagination implemented
- **Parameters:**
  - `status`: `'open'` or `'closed'` (currently only 'open' is used in UI)

#### `useConversation(id)`
- **Purpose:** Fetches single conversation detail
- **Query Key:** `['conversation', id]`
- **API Call:** `agentApi.getConversation(id)`
- **Enabled:** Only when `id` is truthy

#### `useMessages(conversationId)`
- **Purpose:** Fetches messages for a conversation
- **Query Key:** `['messages', conversationId]`
- **API Call:** `agentApi.getMessages(conversationId, { limit: 100 })`
- **Current Behavior:** Fetches last 100 messages, no pagination or infinite scroll
- **Enabled:** Only when `conversationId` is truthy

#### `useSendMessage()`
- **Purpose:** Mutation to send a message
- **API Call:** `agentApi.sendMessage(conversationId, { text })`
- **Side Effects on Success:**
  - Optimistically sets `unreadCount` to 0 and `lastMessageDirection` to 'outbound' in conversation list
  - Invalidates `['messages', conversationId]` and `['conversations']` queries to refetch fresh data

#### `useCloseConversation()`
- **Purpose:** Mutation to close a conversation
- **API Call:** `agentApi.closeConversation(conversationId)`
- **Side Effects:** Invalidates conversation detail and conversations list

### API Client

#### `src/api/client.ts`
- **Purpose:** Configured axios instance for all API calls
- **Base URL:** `VITE_API_BASE_URL` environment variable or `http://localhost:3000`
- **Request Interceptor:** Adds `Authorization: Bearer ${token}` header from localStorage
- **Response Interceptor:** Handles 401 errors by clearing token and redirecting to `/login`

#### `src/api/authApi.ts`
- **Endpoints:**
  - `POST /auth/login` - Login with email/password
  - `GET /auth/me` - Get current agent profile

#### `src/api/agentApi.ts`
- **Endpoints:**
  - `GET /agent/conversations` - List conversations (params: status, page, pageSize)
  - `GET /agent/conversations/:id` - Get single conversation
  - `GET /agent/conversations/:id/messages` - Get messages (params: before, limit)
  - `POST /agent/conversations/:id/reply` - Send message
  - `PATCH /agent/conversations/:id/close` - Close conversation
- **Data Transformation:** Includes `transformConversation()` and `transformMessage()` helpers to normalize backend responses to frontend types

### Filter & Query Params

**Current State:** No URL-based filters or query params are implemented. The conversation status filter ('open' vs 'closed') is hardcoded in `ConversationList.tsx`.

**For Future Implementation:** Would need to:
- Add query params to URL (e.g., `?status=open&search=john`)
- Extract params with `useSearchParams()` from react-router-dom
- Pass params to `useConversations()` hook
- Add UI controls (dropdowns, search input) to update params

---

## 4. Agent & Authentication Context

### Authentication Provider

#### `src/hooks/useAuth.tsx`
- **Purpose:** Manages agent authentication state and provides auth methods
- **Context Provider:** `AuthProvider` component wraps the entire app
- **State:**
  - `agent`: Agent object (`Agent | null`)
  - `token`: JWT token string (`string | null`)
  - `isLoading`: Boolean for initial auth check
- **Methods:**
  - `login(email, password)`: Calls auth API, stores token in localStorage, sets agent state, connects socket
  - `logout()`: Clears token from localStorage, resets state, disconnects socket

#### Agent Data Structure

Defined in `src/types/agent.ts`:

```typescript
interface Agent {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  isActive: boolean;
}
```

### Token Storage

- **Location:** `localStorage` (key: `'token'`)
- **Set on:** Successful login
- **Cleared on:** Logout or 401 response
- **Used by:** axios request interceptor adds to `Authorization` header, socket connection uses for auth

### Initialization Flow

1. App renders with `AuthProvider`
2. On mount, `AuthProvider` checks for existing token in localStorage
3. If token exists, calls `authApi.getMe()` to fetch agent profile
4. If successful, sets agent state and connects socket
5. If failed, clears token and stays logged out
6. Sets `isLoading` to false when complete
7. `ProtectedRoute` checks these values before allowing access

### Agent Display

- **Header.tsx:** Shows agent name with green online indicator and logout button
- **No global agent selector:** Currently assumes single logged-in agent (no "acting as" another agent feature)

---

## 5. Socket / Live Updates

### Socket Client

#### `src/services/socketClient.ts`
- **Purpose:** Singleton class managing Socket.io connection
- **Library:** `socket.io-client@^4.8.1`
- **Connection URL:** `VITE_SOCKET_URL` environment variable or `http://localhost:3000`
- **Authentication:** Token passed in `auth: { token }` option when connecting

### Connection Lifecycle

- **Connect:** Called in `AuthProvider` after successful login or token validation
- **Disconnect:** Called on logout
- **Reconnection:** Handled automatically by Socket.io

### Socket Events Listened

Defined in `socketClient.ts`:

| Event | Trigger | Action |
|-------|---------|--------|
| `connect` | Socket connects | Logs connection ID |
| `disconnect` | Socket disconnects | Logs reason |
| `connect_error` | Connection fails | Logs error |
| `conversation:new` | New conversation created | Invalidates `['conversations', 'open']` query |
| `conversation:updated` | Conversation updated (status, assignment, etc.) | Invalidates `['conversations']` and specific `['conversation', id]` queries |
| `message:new` | New message in any conversation | Invalidates `['messages', conversationId]` and `['conversations']` queries |

### Event Data Expectations

- **conversation:new:** `{ ...conversationData }`
- **conversation:updated:** `{ conversationId, ...updatedFields }`
- **message:new:** `{ conversationId, direction, message }`

### Unread Count Sync

1. When `message:new` event arrives, queries are invalidated
2. Messages are refetched via `useMessages()`
3. `useEffect` in `ConversationView` detects new messages
4. Calls `computeUnreadCount(messages)` utility
5. Updates conversation list cache with computed unread count and last message direction

#### `src/utils/unreadCounter.ts`
- **Logic:** Counts inbound messages after the last outbound (agent) message
- **Edge Cases:**
  - If no outbound message exists, returns 0
  - If last message is outbound, returns 0
  - Only counts messages after the most recent agent reply

### Custom Hook

#### `src/hooks/useSocket.ts`
- **Purpose:** React hook wrapper for socket events
- **Usage:** `useSocket('eventName', callback)`
- **Cleanup:** Automatically removes listener on unmount

---

## 6. Reusable UI Components

### Common Components

Located in `src/components/common/`:

#### `LoadingSpinner.tsx`
- **Purpose:** Animated loading indicator
- **Usage:** Shown during data fetching, authentication checks
- **Style:** Spinning circle with brand primary color

#### `LanguageSwitcher.tsx`
- **Purpose:** Toggle between English and Hebrew
- **Usage:** Shown in header and login page
- **Behavior:** Changes i18n language and sets `dir` attribute on `<html>` for RTL support
- **Icon:** Globe icon with language code

### Message Components

Located in `src/components/messages/`:

#### `MessageList.tsx`
- **Purpose:** Scrollable container for messages
- **Features:** Auto-scrolls to bottom on new messages
- **Empty State:** Shows centered icon with "No messages yet"

#### `MessageBubble.tsx`
- **Purpose:** Individual message bubble (inbound or outbound)
- **Features:**
  - Collapsible text (shows "Read more…" for messages > 260 chars)
  - Linkify URLs (clickable links in messages)
  - Timestamp display (formatted as HH:mm)
  - Checkmark icon for outbound messages
- **Styling:**
  - Inbound: Gray background (`#E5E7EB`), left-aligned
  - Outbound: Blue background (`#2563EB`), white text, right-aligned

#### `MessageInput.tsx`
- **Purpose:** Text input with send button for composing messages
- **Features:**
  - Single-line text input (Enter to send)
  - Send button with loading state (spinner when `disabled`)
  - Button disabled when text is empty
- **Styling:** Rounded input with blue send button

### Layout Components

Located in `src/components/layout/`:

#### `Header.tsx`
- **Purpose:** Top navigation bar
- **Displays:**
  - Logo and app title
  - Language switcher
  - Agent name with online indicator (green dot)
  - Logout button
- **Responsive:** Hides agent name on mobile

### Conversation Components

Located in `src/components/conversations/`:

- **`ConversationList.tsx`** - See "Conversation List & Layout" section
- **`ConversationListItem.tsx`** - See "Conversation List & Layout" section
- **`ConversationView.tsx`** - See "Conversation List & Layout" section

### Reusable Patterns for Future Features

#### Existing UI Elements That Can Be Reused:

1. **Badge/Tag Component:**
   - Currently: Inline `<span>` elements in `ConversationListItem` for plate/part description
   - Used for: Status tags, labels, context info
   - Could be extracted to: `src/components/common/Badge.tsx`

2. **Unread Count Badge:**
   - Currently: Inline in `ConversationListItem`
   - Styling: Red circle with white number
   - Could be extracted for notifications elsewhere

3. **Three Dots / More Options Menu:**
   - **NOT CURRENTLY IMPLEMENTED**
   - Will need to be created for: Assignment actions, status changes, etc.
   - Recommend: Headless UI `Menu` component or similar dropdown

4. **Dropdown/Select Component:**
   - **NOT CURRENTLY IMPLEMENTED**
   - Will be needed for: Status filters, agent assignment selectors
   - Recommend: Headless UI `Listbox` or native `<select>` with Tailwind styling

5. **Buttons:**
   - Styles are currently inline
   - Consider extracting: Primary, secondary, danger button variants
   - Current examples: Login button, logout button, close conversation button, send button

---

## 7. Current Limitations / Gotchas

### 🚨 Hard Refresh Issue

**Problem:** Reloading the page on `/dashboard` (or any non-root route) can cause issues if the Vercel rewrites aren't properly configured.

**Current Config:** `vercel.json` has SPA rewrites configured, but if this fails, the server may return 404 for `/dashboard`.

**Solution for Future:** Ensure `vercel.json` is deployed correctly, or test with `vite preview` locally to simulate production.

---

### 📌 Hardcoded Assumptions

1. **Status Filter:**
   - `ConversationList` is hardcoded to fetch `status: 'open'`
   - No UI toggle to switch to 'closed' conversations
   - Would need to lift status state to `DashboardPage` or use URL params

2. **Pagination:**
   - All queries use fixed limits (50 conversations, 100 messages)
   - No "load more" or infinite scroll
   - Could hit limits with high-volume agents

3. **No Search Functionality:**
   - No search input in conversation list
   - Would need to add search query param and update API call

4. **No Agent Assignment UI:**
   - Backend may support assigned agents, but frontend doesn't display or allow changing assignment
   - Would need to add agent selector dropdown in conversation header or "three dots" menu

5. **Single Agent Context:**
   - No concept of "acting as" another agent or viewing team conversations
   - `useAuth()` provides current agent, but no multi-agent views

---

### 🔧 Unread Count Logic

**Current Behavior:** Unread count is computed on the frontend by analyzing message directions.

**Logic:**
- Unread = inbound messages after last outbound message
- If no outbound message exists, returns 0 (see `unreadCounter.ts`)
- Badge only shows if unread > 0 AND last message is inbound (or unknown)

**Gotcha:** If backend and frontend get out of sync (e.g., backend marks as read, but frontend hasn't refetched), unread count may be incorrect until next socket event or manual refresh.

**Future Consideration:** Backend should be source of truth for unread count. Frontend should only compute for optimistic updates.

---

### 🌐 Environment Variables

Required environment variables (typically in `.env` or Vercel environment settings):

- `VITE_API_BASE_URL`: Backend API base URL (e.g., `https://api.example.com`)
- `VITE_SOCKET_URL`: Socket.io server URL (e.g., `https://api.example.com`)

**Gotcha:** If these are not set, defaults to `http://localhost:3000`, which will fail in production.

---

### 🌍 Internationalization (i18n)

- Uses `i18next` and `react-i18next`
- Locales: `en` (English) and `he` (Hebrew)
- Translation files: `src/i18n/locales/en/common.json` and `src/i18n/locales/he/common.json`
- Switching language also changes document direction (`dir="rtl"` for Hebrew)

**Gotcha:** All new UI text must be added to both locale files, or it will show the translation key instead.

---

### 🧹 No TypeScript Strict Mode

The project uses TypeScript, but doesn't enforce strict mode. Some types may be `any` or loosely typed.

**Recommendation:** Enable `strict: true` in `tsconfig.json` for better type safety when adding new features.

---

### 📦 React Query Configuration

Located in `App.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

- **No refetch on window focus:** May cause stale data if user switches tabs and comes back
- **Retry once:** API failures will retry once before showing error
- **No stale time or cache time configured:** Uses defaults (stale immediately, 5min garbage collection)

---

### 🎨 Styling Approach

- **Tailwind CSS v4** with custom colors
- **No CSS-in-JS library:** Inline styles are used for some dynamic colors (e.g., `style={{ color: '#111827' }}`)
- **Custom theme colors:**
  - Brand primary: `#2563EB` (blue)
  - Brand secondary: Custom values in Tailwind config
  - Neutral: Gray scale

**Gotcha:** Mixing Tailwind classes with inline styles can make refactoring difficult. Consider using Tailwind's JIT for dynamic values or CSS variables.

---

### 📂 File Structure Summary

```
src/
├── api/               # API client and endpoint functions
│   ├── client.ts      # Axios instance with interceptors
│   ├── authApi.ts     # Auth endpoints
│   └── agentApi.ts    # Agent/conversation endpoints
├── components/        # React components
│   ├── common/        # Reusable components (Spinner, LanguageSwitcher)
│   ├── conversations/ # Conversation list and detail views
│   ├── layout/        # Header and layout wrappers
│   └── messages/      # Message bubbles, list, input
├── hooks/             # Custom React hooks
│   ├── useAuth.tsx    # Auth context and hook
│   ├── useConversations.ts  # Data fetching hooks
│   └── useSocket.ts   # Socket event listener hook
├── i18n/              # Internationalization setup
│   ├── index.ts       # i18next config
│   └── locales/       # Translation JSON files
├── pages/             # Route pages
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── router/            # Routing configuration
│   ├── AppRouter.tsx  # Route definitions
│   └── ProtectedRoute.tsx  # Auth guard
├── services/          # Singleton services
│   └── socketClient.ts  # Socket.io client
├── types/             # TypeScript interfaces
│   ├── agent.ts
│   ├── conversation.ts
│   └── message.ts
├── utils/             # Utility functions
│   └── unreadCounter.ts  # Unread count logic
├── App.tsx            # Root component with providers
└── main.tsx           # Entry point
```

---

## Summary of Files Inspected

To build this documentation, the following files were analyzed:

### Core Application Files
- `src/main.tsx` - Entry point
- `src/App.tsx` - Root component with providers
- `src/index.css` - Global styles

### Routing & Pages
- `src/router/AppRouter.tsx` - Route definitions
- `src/router/ProtectedRoute.tsx` - Auth guard
- `src/pages/LoginPage.tsx` - Login page
- `src/pages/DashboardPage.tsx` - Main dashboard

### Authentication & State
- `src/hooks/useAuth.tsx` - Auth context and provider
- `src/hooks/useConversations.ts` - Data fetching hooks
- `src/hooks/useSocket.ts` - Socket event hook

### API & Services
- `src/api/client.ts` - Axios configuration
- `src/api/authApi.ts` - Auth API calls
- `src/api/agentApi.ts` - Agent/conversation API calls
- `src/services/socketClient.ts` - Socket.io client

### Components - Layout
- `src/components/layout/DashboardLayout.tsx` - Main layout wrapper
- `src/components/layout/Header.tsx` - Top navigation bar

### Components - Conversations
- `src/components/conversations/ConversationList.tsx` - List of conversations
- `src/components/conversations/ConversationListItem.tsx` - Individual row
- `src/components/conversations/ConversationView.tsx` - Detail view

### Components - Messages
- `src/components/messages/MessageList.tsx` - Message container
- `src/components/messages/MessageBubble.tsx` - Individual message
- `src/components/messages/MessageInput.tsx` - Input field

### Components - Common
- `src/components/common/LoadingSpinner.tsx` - Loading indicator
- `src/components/common/LanguageSwitcher.tsx` - Language toggle

### Types
- `src/types/agent.ts` - Agent interfaces
- `src/types/conversation.ts` - Conversation interfaces
- `src/types/message.ts` - Message interfaces

### Utilities
- `src/utils/unreadCounter.ts` - Unread count calculation

### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `vercel.json` - Vercel deployment config
- `src/i18n/index.ts` - i18next setup

---

## Next Steps for New Features

When implementing new features (assignment, filters, statuses), this documentation should help you:

1. **Identify which components to modify** (e.g., `ConversationList` for filters)
2. **Understand data flow** (React Query → API → Socket updates)
3. **Find reusable patterns** (badges, buttons, hooks)
4. **Avoid common pitfalls** (hardcoded status, missing search, no pagination)

For assignment/status features, you'll likely need to:
- Add UI controls in `ConversationView` header (dropdown or menu)
- Create new mutation hooks in `useConversations.ts`
- Add new API endpoints in `agentApi.ts`
- Listen to socket events for assignment changes
- Update conversation list to show assigned agent info

Good luck with your feature development! 🚀

