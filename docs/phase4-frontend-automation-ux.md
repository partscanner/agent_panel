# Phase 4: Frontend Automation UX - Implementation Plan

> **Branch:** `main` (frontend development)  
> **Status:** 📋 **PLANNING** - Awaiting approval before implementation  
> **Date:** December 22, 2025  
> **Phase:** 4 - Automation Visibility & Filtering

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Frontend Findings](#current-frontend-findings)
3. [Backend Context (DEV)](#backend-context-dev)
4. [Proposed State & Data Flow](#proposed-state--data-flow)
5. [UI/UX Proposal](#uiux-proposal)
6. [File-by-File Changes](#file-by-file-changes)
7. [Implementation Phases](#implementation-phases)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Edge Cases](#risks--edge-cases)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Goal
Make automation (n8n) results highly visible to agents, enabling them to:
1. **Distinguish** conversations with auto-results vs without
2. **Identify** automation failures immediately
3. **Inspect** automation details (results/errors) in detail panel
4. **Filter** conversations by automation status

### Approach
- **Client-side filtering** - No new backend endpoints required
- **Socket-driven updates** - Real-time automation status via existing events
- **Modern UI** - Badges, icons, cards within current design system
- **Backward compatible** - Graceful handling of old conversations without automation data

### Scope
**In Scope:**
- Type definitions for automation data structures
- Socket event handling for `conversation:n8n_results`
- Conversation list badge display (4 automation states)
- Client-side filtering (chips/toggles for automation states)
- Conversation detail automation panel
- i18n translations (English & Hebrew)

**Out of Scope:**
- New backend API endpoints
- Modifications to message display (no agentSummary changes)
- Backend data structure changes
- Analytics/reporting on automation performance

---

## Current Frontend Findings

### 1. Socket.IO Handling

**Location:** `src/services/socketClient.ts`

**Current Implementation:**
- Singleton class `SocketClient` with connect/disconnect lifecycle
- Stores `QueryClient` reference for cache invalidation
- Currently handles 3 events:
  - `conversation:new` → Invalidates `['conversations', 'open']`
  - `conversation:updated` → Invalidates all conversations + specific conversation detail
  - `message:new` → Invalidates messages + conversations

**Strategy:** Simple invalidation triggers React Query refetch

**Key Finding:**
- ✅ Socket client is well-structured for extension
- ✅ QueryClient reference available for cache updates
- ✅ Event handler registration pattern is clear
- ⚠️ Currently does NOT handle `conversation:n8n_results` event

---

### 2. Conversation State Management

**Location:** `src/hooks/useConversations.ts`

**Current Architecture:**
- **State Layer:** React Query (TanStack Query v5)
- **Strategy:** Server state managed by queries, no global client state
- **Query Keys:**
  ```typescript
  ['conversations', { status, workflowStatus, mine, agentId }]
  ['conversation', conversationId]
  ['messages', conversationId]
  ```

**Key Hooks:**
- `useConversations(filter)` - Fetches conversation list with filters
- `useConversation(id)` - Fetches single conversation detail
- `useMessages(conversationId)` - Fetches messages for conversation
- Mutation hooks: `useSendMessage`, `useCloseConversation`, `useAssignConversation`, `useUpdateWorkflowStatus`

**Data Flow:**
1. Component calls hook
2. React Query checks cache
3. If stale/missing, calls API via `agentApi.ts`
4. API transforms backend response to frontend types
5. Data cached and returned to component
6. Socket events trigger invalidation → background refetch

**Key Finding:**
- ✅ React Query provides excellent caching and invalidation
- ✅ No need for additional state management library
- ⚠️ No current storage for n8n-specific data separate from conversation object
- ⚠️ Socket events currently trigger full refetch (simple but effective)

---

### 3. Conversation List UI

**Location:** `src/components/conversations/ConversationList.tsx`

**Current Structure:**
```
ConversationList
├── Header (sticky)
│   ├── Title + Count
│   ├── Status Filter (dropdown select)
│   │   └── Options: open, new, in_progress, no_answer, won, lost, closed
│   └── "Show only my conversations" Toggle
├── Loading State
├── Error State
├── Empty State
└── Scrollable List
    └── ConversationListItem (multiple)
```

**Filter Implementation:**
- **Type:** Dropdown `<select>` element
- **State:** Local `useState` with `FilterOption` type
- **Options:** 7 workflow-based filters
- **Function:** `getFilterParams()` maps filter to API query params

**Key Finding:**
- ✅ Filter dropdown is well-structured and can be extended
- ✅ Uses translation keys for all labels
- ⚠️ Currently only filters by workflow status (not automation status)
- 💡 **Opportunity:** Add secondary filter row for automation-specific filters

---

### 4. Conversation List Item UI

**Location:** `src/components/conversations/ConversationListItem.tsx`

**Current Layout:**
```
ConversationListItem
├── Zone A: Main Content (flex-1)
│   ├── Display Name
│   ├── Last Message Preview
│   └── Context Badges (plate, vehicle, part)
└── Zone B: Meta Info (flex-col items-end)
    ├── Timestamp
    ├── WorkflowStatusBadge (if present)
    ├── Assigned Agent Badge (if present)
    └── Unread Count Badge (if > 0 and inbound)
```

**Styling:**
- Active state: Blue left border, blue background, shadow
- Hover state: Gray background, subtle shadow
- Rounded corners, padding: `px-6 py-5`
- RTL-aware layout

**Key Finding:**
- ✅ Zone B (meta area) is ideal location for automation badge
- ✅ `WorkflowStatusBadge` component provides design pattern to follow
- ✅ Badge display is conditional (only if data present)
- 💡 **Opportunity:** Add automation badge after workflow badge in Zone B

---

### 5. Conversation Detail UI

**Location:** `src/components/conversations/ConversationView.tsx`

**Current Structure:**
```
ConversationView
├── Loading State
├── Error State
└── Main Content
    ├── Header
    │   ├── Customer Info + Avatar
    │   ├── Assigned Agent Display
    │   ├── WorkflowStatusBadge + Edit Dropdown
    │   ├── Context Badges (plate, vehicle, part)
    │   ├── ConversationActionsMenu (3-dots)
    │   └── Close Button
    ├── MessageList (scrollable)
    │   └── MessageBubble (multiple)
    └── MessageInput (or "Closed" message)
```

**Key Finding:**
- ✅ Header has multiple info sections (customer, agent, workflow, context)
- ✅ Clean separation between header and messages
- ⚠️ No dedicated section for automation/n8n details
- 💡 **Opportunity:** Add "Automation (n8n)" panel between header and messages

---

### 6. API Layer

**Location:** `src/api/agentApi.ts`

**Current Implementation:**
- `transformConversation()` - Maps backend snake_case to frontend camelCase
- Handles multiple possible backend field names (flexible)
- Supports optional fields gracefully

**Key Finding:**
- ⚠️ **NO automation/preHandoff/n8n data currently fetched or transformed**
- ✅ Transform function is extensible (easy to add new fields)
- ⚠️ Unknown if backend API currently returns `preHandoff.n8n` data in responses

**Critical Question:**
Does `GET /agent/conversations/:id` currently return `preHandoff.n8n` data?
- If YES: Simple to add to transform function
- If NO: Rely solely on socket events (risk: data lost on refresh)

---

### 7. Type Definitions

**Location:** `src/types/conversation.ts`

**Current Conversation Interface:**
```typescript
export interface Conversation {
  id: string;
  customerId: string;
  customerPhone?: string;
  userPhone?: string;
  displayName?: string;
  userName?: string;
  status: 'open' | 'closed';
  workflowStatus?: WorkflowStatus;
  context?: ConversationContext;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageDirection?: 'inbound' | 'outbound';
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    role: 'agent' | 'admin';
  } | null;
}
```

**Key Finding:**
- ⚠️ **NO automation field** in Conversation type
- ✅ Type definition is clean and extensible
- ✅ Optional fields pattern established

---

## Backend Context (DEV)

### Socket Event Payloads (from backend team)

#### 1. `conversation:new` and `conversation:updated`

**Includes:**
```typescript
conversation.automation = {
  n8nStatus: 'success_with_results' | 'success_empty' | 'failed' | 'disabled' | null,
  autoResultsSent: boolean,
  failure: boolean
}
```

**Notes:**
- `autoResultsSent: true` means customer received auto-results
- `failure: true` means automation encountered an error
- `n8nStatus` provides detailed state
- `disabled` means automation was not attempted for this conversation

#### 2. `conversation:n8n_results` (NEW EVENT)

**Payload:**
```typescript
{
  conversationId: string;
  status: 'success_with_results' | 'success_empty' | 'failed';
  results: Array<{
    title: string;
    price?: string;
    source?: string;
    canonicalUrl: string;
  }>; // 0-3 results
  errorCode?: string;
  errorMessage?: string;
  meta?: {
    duration?: number;
    attempts?: number;
    timestamp?: string;
  };
}
```

**Notes:**
- Provides detailed n8n execution results
- May arrive before or after `conversation:new` (timing race condition)
- Results array can be empty even on success
- Error fields only present when `status === 'failed'`

#### 3. Database Persistence

**Location:** `conversation.preHandoff.n8n` (backend DB)

**Structure:** (Assumed to match socket payload)
```typescript
preHandoff?: {
  n8n?: {
    status: string;
    results?: Array<{
      title: string;
      price?: string;
      source?: string;
      canonicalUrl: string;
    }>;
    errorCode?: string;
    errorMessage?: string;
    meta?: {
      duration?: number;
      attempts?: number;
      timestamp?: string;
    };
  };
}
```

**Critical Unknown:**
❓ Does `GET /agent/conversations/:id` API return `preHandoff.n8n` data?
- **If YES:** Can restore automation details on page refresh
- **If NO:** Must handle missing data gracefully (show "Refresh to see details")

---

## Proposed State & Data Flow

### 1. Type Definitions

#### A. Extend Conversation Type

**File:** `src/types/conversation.ts`

```typescript
// Add new types
export type AutomationStatus = 
  | 'success_with_results'
  | 'success_empty'
  | 'failed'
  | 'disabled'
  | null;

export interface AutomationSummary {
  n8nStatus: AutomationStatus;
  autoResultsSent: boolean;
  failure: boolean;
}

export interface AutomationResult {
  title: string;
  price?: string;
  source?: string;
  canonicalUrl: string;
}

export interface AutomationDetails {
  status: 'success_with_results' | 'success_empty' | 'failed';
  results?: AutomationResult[];
  errorCode?: string;
  errorMessage?: string;
  meta?: {
    duration?: number;
    attempts?: number;
    timestamp?: string;
  };
}

// Extend Conversation interface
export interface Conversation {
  // ... existing fields
  automation?: AutomationSummary;      // From conversation:new/updated
  automationDetails?: AutomationDetails; // From conversation:n8n_results or preHandoff.n8n
}
```

**Rationale:**
- Separate `automation` (summary for list display) from `automationDetails` (full data for detail panel)
- Matches backend payload structure
- All fields optional for backward compatibility

---

### 2. Socket Event Handling

#### A. Add `conversation:n8n_results` Handler

**File:** `src/services/socketClient.ts`

**Strategy:**
```typescript
this.socket.on('conversation:n8n_results', (data) => {
  console.log('[Socket] n8n results:', data);
  
  const { conversationId, ...n8nData } = data;
  
  // Update conversation detail cache
  this.queryClient?.setQueryData(
    ['conversation', conversationId],
    (oldData: any) => {
      if (!oldData?.conversation) return oldData;
      
      return {
        ...oldData,
        conversation: {
          ...oldData.conversation,
          automationDetails: n8nData,
        },
      };
    }
  );
  
  // Update conversation list caches (all filter combinations)
  const allListQueries = this.queryClient?.getQueriesData({
    queryKey: ['conversations'],
  });
  
  allListQueries?.forEach(([queryKey, oldData]) => {
    if (!oldData?.items) return;
    
    this.queryClient?.setQueryData(queryKey, {
      ...oldData,
      items: oldData.items.map((conv: any) =>
        conv.id === conversationId
          ? { ...conv, automationDetails: n8nData }
          : conv
      ),
    });
  });
});
```

**Rationale:**
- **Optimistic cache update** - No network request needed
- **Updates both list and detail** - Keeps UI consistent
- **Handles all filter combinations** - Uses `getQueriesData` wildcard
- **Merge, don't overwrite** - Preserves other conversation fields

**Edge Case Handling:**
- If `conversation:n8n_results` arrives before `conversation:new`:
  - Cache may not exist yet
  - Solution: Event handler checks `if (!oldData)` and returns early
  - When conversation appears, it will have `automation` but not `automationDetails`
  - This is acceptable: Show "Processing..." state until details arrive

---

### 3. API Transform Updates

#### A. Extend `transformConversation()`

**File:** `src/api/agentApi.ts`

```typescript
const transformConversation = (backendConv: any): Conversation => {
  // ... existing transformation logic
  
  // Transform automation summary (always present in conversation:new/updated)
  const automation = backendConv.automation ? {
    n8nStatus: backendConv.automation.n8nStatus || backendConv.automation.n8n_status,
    autoResultsSent: backendConv.automation.autoResultsSent ?? backendConv.automation.auto_results_sent ?? false,
    failure: backendConv.automation.failure ?? false,
  } : undefined;
  
  // Transform automation details (from preHandoff.n8n if API returns it)
  const automationDetails = backendConv.preHandoff?.n8n || backendConv.preHandoff_n8n ? {
    status: backendConv.preHandoff?.n8n?.status || backendConv.preHandoff_n8n?.status,
    results: backendConv.preHandoff?.n8n?.results || backendConv.preHandoff_n8n?.results,
    errorCode: backendConv.preHandoff?.n8n?.errorCode || backendConv.preHandoff_n8n?.error_code,
    errorMessage: backendConv.preHandoff?.n8n?.errorMessage || backendConv.preHandoff_n8n?.error_message,
    meta: backendConv.preHandoff?.n8n?.meta || backendConv.preHandoff_n8n?.meta,
  } : undefined;
  
  return {
    // ... existing fields
    automation,
    automationDetails,
  };
};
```

**Rationale:**
- Handles both camelCase and snake_case from backend
- Supports nested `preHandoff.n8n` structure
- Gracefully handles missing data (undefined)
- If backend doesn't return `preHandoff.n8n`, `automationDetails` will be undefined (OK)

---

### 4. Client-Side Filtering

#### A. Filter State Management

**File:** `src/components/conversations/ConversationList.tsx`

**Add Automation Filter State:**
```typescript
type AutomationFilter = 'all' | 'auto_sent' | 'auto_failed' | 'auto_empty' | 'auto_disabled';

const [automationFilter, setAutomationFilter] = useState<AutomationFilter>('all');
```

**Filter Function:**
```typescript
const filterByAutomation = (conversations: Conversation[]): Conversation[] => {
  if (automationFilter === 'all') return conversations;
  
  return conversations.filter((conv) => {
    const auto = conv.automation;
    if (!auto) return automationFilter === 'all'; // Old conversations without automation
    
    switch (automationFilter) {
      case 'auto_sent':
        return auto.autoResultsSent === true;
      case 'auto_failed':
        return auto.failure === true;
      case 'auto_empty':
        return auto.n8nStatus === 'success_empty';
      case 'auto_disabled':
        return auto.n8nStatus === 'disabled';
      default:
        return true;
    }
  });
};

// Apply filter after fetching
const filteredConversations = filterByAutomation(conversations);
```

**Rationale:**
- **Client-side only** - No backend changes needed
- **Fast** - Filters in-memory data
- **Composable** - Works with existing workflow filter
- **Backward compatible** - Old conversations (no automation) treated as "all"

---

### 5. Data Merge Strategy

**Principle:** Never overwrite newer data with older data

**Scenarios:**

#### Scenario A: Normal Flow
1. `conversation:new` arrives → Sets `automation` summary
2. User opens conversation → Detail panel shows summary
3. `conversation:n8n_results` arrives → Sets `automationDetails`
4. Detail panel now shows full results

#### Scenario B: Race Condition (n8n results arrive first)
1. `conversation:n8n_results` arrives → Cache miss, no update
2. `conversation:new` arrives → Sets `automation` summary
3. User opens conversation → Shows summary but no details
4. **Workaround:** Show "Processing..." if `automation` exists but `automationDetails` doesn't

#### Scenario C: Page Refresh (API returns preHandoff.n8n)
1. User refreshes page
2. `GET /agent/conversations` returns list with `automation` summary
3. User opens conversation
4. `GET /agent/conversations/:id` returns full conversation with `preHandoff.n8n`
5. Transform function maps to `automationDetails`
6. Detail panel shows full results immediately

#### Scenario D: Page Refresh (API does NOT return preHandoff.n8n)
1. User refreshes page
2. `GET /agent/conversations` returns list with `automation` summary
3. User opens conversation
4. `GET /agent/conversations/:id` returns conversation WITHOUT `preHandoff.n8n`
5. `automationDetails` is undefined
6. Detail panel shows: "Automation data unavailable after refresh. Details will appear for new conversations."

**Merge Rule:**
```typescript
// When merging socket data into cache:
const mergedConversation = {
  ...existingConversation,
  automation: newData.automation ?? existingConversation.automation,
  automationDetails: newData.automationDetails ?? existingConversation.automationDetails,
};
```

**Never:**
- Overwrite `automationDetails` with `undefined`
- Clear existing data on updates
- Lose data on refetch

---

## UI/UX Proposal

### Design Principles
1. **Minimal & Intentional** - Don't clutter, add value
2. **Consistent** - Follow existing badge/card patterns
3. **Informative** - Show what agents need at a glance
4. **Delightful** - Small touches (icons, colors, spacing)
5. **Responsive** - Works on all screen sizes

---

### 1. Conversation List - Automation Badge

#### A. Badge Design

**Component:** `AutomationBadge.tsx` (new, similar to `WorkflowStatusBadge.tsx`)

**Visual Spec:**
```
┌─────────────────────┐
│ 🤖 Auto sent        │  ← Green (success)
└─────────────────────┘

┌─────────────────────┐
│ ⚠️ Auto failed      │  ← Red (error)
└─────────────────────┘

┌─────────────────────┐
│ ℹ️ Auto empty       │  ← Blue (info)
└─────────────────────┘

┌─────────────────────┐
│ ⛔ Auto disabled     │  ← Gray (neutral)
└─────────────────────┘
```

**CSS Classes:**
```typescript
const colorClasses = {
  auto_sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  auto_failed: 'bg-rose-50 text-rose-700 border-rose-200',
  auto_empty: 'bg-blue-50 text-blue-600 border-blue-200',
  auto_disabled: 'bg-gray-50 text-gray-600 border-gray-200',
};
```

**Icons:**
- ✅ Auto sent: Success checkmark
- ⚠️ Auto failed: Warning triangle
- ℹ️ Auto empty: Info circle
- ⛔ Auto disabled: Slash circle

**Size & Spacing:**
- Font: `text-xs` (12px)
- Padding: `px-2 py-1`
- Rounded: `rounded-md`
- Border: `border`
- Gap from other badges: `gap-1.5`

#### B. Placement in List Item

**Location:** Zone B (meta info), after workflow badge, before unread count

**Layout:**
```
ConversationListItem
└── Zone B (flex-col items-end)
    ├── Timestamp            ← 12:34 PM
    ├── WorkflowStatusBadge  ← [In Progress]
    ├── AutomationBadge      ← [✅ Auto sent]  ← NEW
    ├── Assigned Agent Badge ← [👤 John]
    └── Unread Count Badge   ← (3)
```

**RTL Support:**
- Items align `ltr:items-end rtl:items-start`
- Badge text naturally mirrors
- Icon position handled by flexbox

---

### 2. Conversation List - Automation Filters

#### A. Filter UI Design

**Option 1: Pill Buttons (RECOMMENDED)**

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│ Automation:                                                 │
│ [All] [✅ Auto sent] [⚠️ Failed] [ℹ️ Empty] [⛔ Disabled]   │
└─────────────────────────────────────────────────────────────┘
```

**CSS:**
- Active: Blue background, white text, shadow
- Inactive: Gray background, gray text, hover effect
- Pills: `rounded-full px-3 py-1.5 text-xs font-medium`
- Container: Horizontal scroll on mobile

**Option 2: Dropdown (Alternative)**

**Visual:**
```
┌─────────────────────────────────────┐
│ Automation: [All ▼]                 │
│   • All                             │
│   • ✅ Auto sent                    │
│   • ⚠️ Auto failed                  │
│   • ℹ️ Auto empty                   │
│   • ⛔ Auto disabled                 │
└─────────────────────────────────────┘
```

**Decision:** **Pill buttons** for better visibility and quick access

#### B. Placement

**Location:** Between "Status Filter" dropdown and "Show Mine Only" toggle

**Full Header Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Conversations                                      (24) │
│                                                          │
│  Status:                                                 │
│  [Open ▼]                           ← Existing dropdown │
│                                                          │
│  Automation:                                    ← NEW    │
│  [All] [✅ Sent] [⚠️ Failed] [ℹ️ Empty] [⛔ Disabled]   │
│                                                          │
│  [Toggle] Show only my conversations  ← Existing toggle │
└─────────────────────────────────────────────────────────┘
```

**Mobile (< 768px):**
- Pills wrap to multiple lines
- Container: `flex-wrap gap-2`
- Horizontal scroll if needed: `overflow-x-auto`

---

### 3. Conversation Detail - Automation Panel

#### A. Panel Design

**Component:** `AutomationPanel.tsx` (new)

**Placement:** Between conversation header and MessageList

**Full Detail Layout:**
```
ConversationView
├── Header (customer, agent, workflow, context)
├── AutomationPanel ← NEW (conditional: only if automation data exists)
├── MessageList
└── MessageInput
```

#### B. Panel Visual Spec

**Variant 1: Success with Results**

```
┌───────────────────────────────────────────────────────────┐
│ 🤖 Automation (n8n)                              [Expand] │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Status: ✅ Auto-results sent to customer                │
│  Duration: 1.2s  •  Timestamp: 2 hours ago               │
│                                                           │
│  📦 Results (3):                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Front Bumper for Toyota Corolla 2020               │ │
│  │ Price: $250  •  Source: PartSource Inc.           │ │
│  │ 🔗 View Details →                                  │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ OEM Front Bumper (Original)                        │ │
│  │ Price: $420  •  Source: Toyota Dealer             │ │
│  │ 🔗 View Details →                                  │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Aftermarket Bumper - Compatible                    │ │
│  │ Price: $180  •  Source: AutoParts.com             │ │
│  │ 🔗 View Details →                                  │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

**Variant 2: Success Empty**

```
┌───────────────────────────────────────────────────────────┐
│ 🤖 Automation (n8n)                                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Status: ℹ️ No results found                             │
│  Duration: 0.8s  •  Timestamp: 1 hour ago                │
│                                                           │
│  📭 No matching parts found                              │
│  The automated search didn't find any results for this   │
│  request. An agent can help with a manual search.        │
└───────────────────────────────────────────────────────────┘
```

**Variant 3: Failed**

```
┌───────────────────────────────────────────────────────────┐
│ 🤖 Automation (n8n)                                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Status: ⚠️ Automation failed                            │
│  Attempts: 2  •  Timestamp: 30 minutes ago               │
│                                                           │
│  ❌ Error Details                                         │
│  Code: VALIDATION_ERROR                                  │
│  Message: Missing required field: vehicle plate number   │
│                                                           │
│  💡 Agent action required: Manually search for parts     │
└───────────────────────────────────────────────────────────┘
```

**Variant 4: Disabled**

```
┌───────────────────────────────────────────────────────────┐
│ 🤖 Automation (n8n)                                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Status: ⛔ Automation not attempted                     │
│                                                           │
│  ℹ️ This conversation did not trigger automated search  │
│  Possible reasons:                                       │
│  • Started before automation was enabled                 │
│  • Manually created by agent                            │
│  • Automation rules not met                             │
└───────────────────────────────────────────────────────────┘
```

**Variant 5: No Data (Old Conversations)**

```
(Panel not rendered at all)
```

#### C. Panel States

**Collapsible:**
- Default: Expanded
- User can collapse to save space
- State persisted in localStorage: `automationPanel_${conversationId}_collapsed`

**Loading State (while waiting for n8n_results event):**
```
┌───────────────────────────────────────────────────────────┐
│ 🤖 Automation (n8n)                                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Status: ⏳ Processing...                                │
│  Automation results are being fetched.                   │
└───────────────────────────────────────────────────────────┘
```

**Condition to Show Loading:**
- `conversation.automation` exists (summary available)
- `conversation.automationDetails` is undefined (details not yet received)
- Show for maximum 10 seconds, then show "Details unavailable" message

#### D. Result Card Design

**CSS Classes:**
```typescript
// Card container
className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"

// Title
className="text-sm font-semibold text-gray-900 mb-2"

// Meta row (price + source)
className="flex items-center gap-3 text-xs text-gray-600 mb-3"

// Link
className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
```

**Click Behavior:**
- Clicking card or "View Details" link opens `canonicalUrl` in new tab
- `target="_blank" rel="noopener noreferrer"`

---

### 4. Empty & Error States

#### A. No Automation Data (Old Conversations)

**List Item:**
- No automation badge shown
- Conversation displays normally

**Detail Panel:**
- Panel not rendered at all
- No indication of automation (clean)

#### B. Automation Processing

**List Item:**
- Show "⏳ Processing" badge (gray, spinner icon)

**Detail Panel:**
- Show loading state (see Panel States above)

#### C. Automation Failed

**List Item:**
- Show "⚠️ Auto failed" badge (red)

**Detail Panel:**
- Show error details (see Variant 3 above)
- Display error code and message
- Provide actionable guidance

---

### 5. Responsive Design

#### Desktop (≥ 1024px)
- Automation filter pills: Single row, no wrap
- Result cards: Full width within panel
- Panel width: Matches conversation detail width

#### Tablet (768px - 1023px)
- Automation filter pills: May wrap to 2 rows
- Result cards: Full width
- Panel: Full width within available space

#### Mobile (< 768px)
- Automation filter pills: Horizontal scroll or wrap
- Result cards: Simplified layout (stack price/source vertically)
- Panel: Full width, slightly reduced padding

---

## File-by-File Changes

### 1. Type Definitions

#### `src/types/conversation.ts`

**Changes:**
- Add `AutomationStatus` type
- Add `AutomationSummary` interface
- Add `AutomationResult` interface  
- Add `AutomationDetails` interface
- Extend `Conversation` interface with `automation?` and `automationDetails?` fields

**Lines to Add:** ~40 lines

---

### 2. Socket Client

#### `src/services/socketClient.ts`

**Changes:**
- Add `conversation:n8n_results` event listener
- Implement cache update logic for both conversation detail and list queries
- Add console logging for debugging

**Lines to Add:** ~35 lines

---

### 3. API Layer

#### `src/api/agentApi.ts`

**Changes:**
- Extend `transformConversation()` function
- Add transformation for `automation` field (from backend)
- Add transformation for `automationDetails` field (from `preHandoff.n8n`)
- Support both camelCase and snake_case

**Lines to Add:** ~25 lines

---

### 4. New Components

#### `src/components/conversations/AutomationBadge.tsx` (NEW FILE)

**Purpose:** Display automation status badge in conversation list

**Props:**
```typescript
interface AutomationBadgeProps {
  automation: AutomationSummary;
  className?: string;
}
```

**Features:**
- 4 badge variants (sent, failed, empty, disabled)
- Icons + colors
- i18n labels
- RTL support

**Lines:** ~80 lines

---

#### `src/components/conversations/AutomationPanel.tsx` (NEW FILE)

**Purpose:** Display automation details in conversation view

**Props:**
```typescript
interface AutomationPanelProps {
  automation?: AutomationSummary;
  automationDetails?: AutomationDetails;
  conversationId: string;
}
```

**Features:**
- Collapsible panel
- 5 variants (success with results, success empty, failed, disabled, loading)
- Result cards with clickable links
- Error display
- Empty states
- Responsive layout

**Lines:** ~250 lines

---

### 5. Modified Components

#### `src/components/conversations/ConversationList.tsx`

**Changes:**
- Add `automationFilter` state (`useState`)
- Add automation filter UI (pill buttons)
- Add `filterByAutomation()` function
- Apply client-side filter to conversations
- Add i18n translations for filter labels

**Lines to Add:** ~80 lines

---

#### `src/components/conversations/ConversationListItem.tsx`

**Changes:**
- Import `AutomationBadge` component
- Add automation badge to Zone B (after workflow badge)
- Conditional rendering (only if `conversation.automation` exists)

**Lines to Add:** ~10 lines

---

#### `src/components/conversations/ConversationView.tsx`

**Changes:**
- Import `AutomationPanel` component
- Add `AutomationPanel` between header and MessageList
- Conditional rendering (only if `conversation.automation` exists)
- Pass `automation` and `automationDetails` props

**Lines to Add:** ~8 lines

---

### 6. Translations

#### `src/i18n/locales/en/common.json`

**Add:**
```json
{
  "automation": {
    "title": "Automation (n8n)",
    "status": "Status",
    "duration": "Duration",
    "timestamp": "Timestamp",
    "attempts": "Attempts",
    "results": "Results",
    "noResults": "No matching parts found",
    "noResultsMessage": "The automated search didn't find any results for this request. An agent can help with a manual search.",
    "errorTitle": "Error Details",
    "errorCode": "Code",
    "errorMessage": "Message",
    "agentActionRequired": "Agent action required: Manually search for parts",
    "viewDetails": "View Details",
    "processing": "Processing...",
    "processingMessage": "Automation results are being fetched.",
    "notAttempted": "Automation not attempted",
    "notAttemptedReasons": "Possible reasons:",
    "notAttemptedReason1": "Started before automation was enabled",
    "notAttemptedReason2": "Manually created by agent",
    "notAttemptedReason3": "Automation rules not met",
    "expand": "Expand",
    "collapse": "Collapse"
  },
  "automationBadge": {
    "autoSent": "Auto sent",
    "autoFailed": "Auto failed",
    "autoEmpty": "Auto empty",
    "autoDisabled": "Auto disabled"
  },
  "automationFilters": {
    "label": "Automation",
    "all": "All",
    "autoSent": "Auto sent",
    "autoFailed": "Failed",
    "autoEmpty": "Empty",
    "autoDisabled": "Disabled"
  }
}
```

**Lines to Add:** ~35 lines

---

#### `src/i18n/locales/he/common.json`

**Add:** (Hebrew translations of all English keys above)

```json
{
  "automation": {
    "title": "אוטומציה (n8n)",
    "status": "סטטוס",
    "duration": "משך זמן",
    "timestamp": "זמן",
    "attempts": "ניסיונות",
    "results": "תוצאות",
    "noResults": "לא נמצאו חלקים תואמים",
    "noResultsMessage": "החיפוש האוטומטי לא מצא תוצאות לבקשה זו. נציג יכול לעזור בחיפוש ידני.",
    "errorTitle": "פרטי שגיאה",
    "errorCode": "קוד",
    "errorMessage": "הודעה",
    "agentActionRequired": "נדרשת פעולת נציג: חפש חלקים באופן ידני",
    "viewDetails": "צפה בפרטים",
    "processing": "מעבד...",
    "processingMessage": "תוצאות האוטומציה נטענות.",
    "notAttempted": "אוטומציה לא נוסתה",
    "notAttemptedReasons": "סיבות אפשריות:",
    "notAttemptedReason1": "התחיל לפני שהאוטומציה הופעלה",
    "notAttemptedReason2": "נוצר באופן ידני על ידי נציג",
    "notAttemptedReason3": "כללי האוטומציה לא התקיימו",
    "expand": "הרחב",
    "collapse": "כווץ"
  },
  "automationBadge": {
    "autoSent": "נשלח אוטומטית",
    "autoFailed": "נכשל אוטומטית",
    "autoEmpty": "ריק אוטומטית",
    "autoDisabled": "אוטומציה מושבתת"
  },
  "automationFilters": {
    "label": "אוטומציה",
    "all": "הכל",
    "autoSent": "נשלח אוטומטית",
    "autoFailed": "נכשל",
    "autoEmpty": "ריק",
    "autoDisabled": "מושבת"
  }
}
```

**Lines to Add:** ~35 lines

---

### Summary of Changes

| File | Type | Lines Added | Complexity |
|------|------|-------------|------------|
| `src/types/conversation.ts` | Modified | ~40 | Low |
| `src/services/socketClient.ts` | Modified | ~35 | Medium |
| `src/api/agentApi.ts` | Modified | ~25 | Low |
| `src/components/conversations/AutomationBadge.tsx` | New | ~80 | Low |
| `src/components/conversations/AutomationPanel.tsx` | New | ~250 | Medium |
| `src/components/conversations/ConversationList.tsx` | Modified | ~80 | Medium |
| `src/components/conversations/ConversationListItem.tsx` | Modified | ~10 | Low |
| `src/components/conversations/ConversationView.tsx` | Modified | ~8 | Low |
| `src/i18n/locales/en/common.json` | Modified | ~35 | Low |
| `src/i18n/locales/he/common.json` | Modified | ~35 | Low |
| **TOTAL** | **2 new, 8 modified** | **~598 lines** | **Medium** |

---

## Implementation Phases

### Phase 1: Foundation (2-3 hours)
**Goal:** Set up data structures and socket handling

**Tasks:**
1. ✅ Update `src/types/conversation.ts` with new types
2. ✅ Extend `transformConversation()` in `src/api/agentApi.ts`
3. ✅ Add `conversation:n8n_results` handler in `src/services/socketClient.ts`
4. ✅ Test socket event handling with console logs

**Validation:**
- TypeScript compiles without errors
- Socket events logged correctly
- Cache updates observable in React DevTools

---

### Phase 2: Conversation List Badge (1-2 hours)
**Goal:** Show automation status in list

**Tasks:**
1. ✅ Create `AutomationBadge.tsx` component
2. ✅ Add English translations for badge labels
3. ✅ Add Hebrew translations for badge labels
4. ✅ Integrate badge into `ConversationListItem.tsx`
5. ✅ Test all 4 badge variants

**Validation:**
- Badge displays correctly for each automation status
- Badge hidden for conversations without automation data
- RTL layout works in Hebrew
- Colors and icons match design spec

---

### Phase 3: Conversation List Filters (2-3 hours)
**Goal:** Enable filtering by automation status

**Tasks:**
1. ✅ Add automation filter state to `ConversationList.tsx`
2. ✅ Implement `filterByAutomation()` function
3. ✅ Add filter UI (pill buttons)
4. ✅ Add English translations for filter labels
5. ✅ Add Hebrew translations for filter labels
6. ✅ Test all filter combinations (workflow + automation)

**Validation:**
- Filters work correctly (client-side)
- Filter pills respond to clicks
- Active filter highlighted
- Filters compose with existing workflow filters
- Count updates correctly
- Responsive on mobile (pills wrap or scroll)

---

### Phase 4: Automation Detail Panel (3-4 hours)
**Goal:** Show detailed automation info in conversation view

**Tasks:**
1. ✅ Create `AutomationPanel.tsx` component
2. ✅ Implement all 5 panel variants (success with results, success empty, failed, disabled, loading)
3. ✅ Add result card UI
4. ✅ Add collapsible functionality
5. ✅ Add English translations for panel content
6. ✅ Add Hebrew translations for panel content
7. ✅ Integrate panel into `ConversationView.tsx`
8. ✅ Test all variants

**Validation:**
- Panel renders correctly for each automation status
- Result cards clickable (open in new tab)
- Collapse/expand works
- Error details display correctly
- Loading state appears when appropriate
- Panel hidden for old conversations
- Responsive layout on mobile

---

### Phase 5: Polish & Edge Cases (1-2 hours)
**Goal:** Handle edge cases and polish UX

**Tasks:**
1. ✅ Test race condition (n8n_results before conversation:new)
2. ✅ Test page refresh behavior (with/without API returning preHandoff.n8n)
3. ✅ Test old conversations (no automation data)
4. ✅ Add loading timeout (10 seconds max)
5. ✅ Test RTL layout thoroughly
6. ✅ Add hover states and micro-interactions
7. ✅ Test responsive design on all breakpoints

**Validation:**
- No crashes or errors in any scenario
- Graceful degradation when data unavailable
- Loading states don't hang forever
- RTL layout perfect in Hebrew
- Smooth animations and transitions
- Mobile UX excellent

---

### Phase 6: Testing & Documentation (1 hour)
**Goal:** Comprehensive testing and documentation

**Tasks:**
1. ✅ Manual testing checklist (see Testing Strategy section)
2. ✅ Update component documentation
3. ✅ Add code comments for complex logic
4. ✅ Screenshot all UI variants for documentation

**Validation:**
- All acceptance criteria met
- No regressions in existing features
- Code reviewed and approved

---

**Total Estimated Time:** 10-15 hours

---

## Acceptance Criteria

### Functional Requirements

#### ✅ FR1: Automation Badge in List
- [ ] Badge displays in conversation list for conversations with automation data
- [ ] Badge shows correct status: "Auto sent", "Auto failed", "Auto empty", "Auto disabled"
- [ ] Badge has appropriate color: green, red, blue, gray
- [ ] Badge includes icon matching status
- [ ] Badge hidden for conversations without automation data
- [ ] Badge positioned correctly in Zone B (meta area)
- [ ] Badge works in RTL layout (Hebrew)

#### ✅ FR2: Automation Filtering
- [ ] Filter UI visible in conversation list header
- [ ] 5 filter options: All, Auto sent, Auto failed, Auto empty, Auto disabled
- [ ] Active filter highlighted visually
- [ ] Clicking filter updates conversation list immediately
- [ ] Filter is client-side (no API calls)
- [ ] Filter composes with existing workflow filter
- [ ] Conversation count updates when filter applied
- [ ] Old conversations (no automation) only appear in "All" filter

#### ✅ FR3: Automation Detail Panel
- [ ] Panel displays in conversation view when automation data exists
- [ ] Panel hidden for conversations without automation data
- [ ] Panel shows appropriate variant based on automation status:
  - [ ] Success with results: Shows result cards
  - [ ] Success empty: Shows "No results" message
  - [ ] Failed: Shows error code and message
  - [ ] Disabled: Shows informational message
  - [ ] Loading: Shows processing state (if details not yet received)
- [ ] Panel is collapsible (expand/collapse)
- [ ] Collapse state persisted per conversation

#### ✅ FR4: Result Cards
- [ ] Result cards display for "success_with_results" status
- [ ] Card shows: Title, Price (if available), Source (if available)
- [ ] Card includes "View Details" link with external link icon
- [ ] Clicking card or link opens `canonicalUrl` in new tab
- [ ] Up to 3 result cards displayed
- [ ] Cards have hover effect (shadow increase)

#### ✅ FR5: Socket Event Handling
- [ ] `conversation:new` updates conversation with `automation` summary
- [ ] `conversation:updated` updates conversation with `automation` summary
- [ ] `conversation:n8n_results` updates conversation with `automationDetails`
- [ ] Socket events update both conversation list and detail view
- [ ] Cache updates are optimistic (no full refetch)
- [ ] Events logged to console for debugging

#### ✅ FR6: Error Handling
- [ ] Graceful handling if `conversation:n8n_results` arrives before `conversation:new`
- [ ] Loading state shown if `automation` exists but `automationDetails` doesn't
- [ ] Loading state times out after 10 seconds
- [ ] Error details displayed clearly in panel
- [ ] No crashes if automation data structure is unexpected

---

### Non-Functional Requirements

#### ✅ NFR1: Internationalization
- [ ] All UI text translated to English and Hebrew
- [ ] RTL layout works perfectly in Hebrew
- [ ] Date/time formatting respects locale

#### ✅ NFR2: Performance
- [ ] Client-side filtering is fast (< 50ms for 100 conversations)
- [ ] No unnecessary re-renders
- [ ] Socket event handling doesn't block UI

#### ✅ NFR3: Responsive Design
- [ ] Automation filters responsive on mobile (wrap or horizontal scroll)
- [ ] Automation panel responsive on mobile (simplified result cards)
- [ ] No horizontal overflow on small screens

#### ✅ NFR4: Accessibility
- [ ] Filter buttons keyboard-accessible (tab navigation)
- [ ] Links have proper `target="_blank" rel="noopener noreferrer"`
- [ ] Colors meet WCAG contrast requirements

#### ✅ NFR5: Code Quality
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] All new components have proper type definitions
- [ ] Code follows existing project patterns
- [ ] No console errors or warnings
- [ ] Meaningful variable and function names

---

### Edge Cases

#### ✅ EC1: Old Conversations (No Automation Data)
- [ ] No automation badge shown
- [ ] No automation panel shown
- [ ] Conversation displays normally
- [ ] No errors or warnings

#### ✅ EC2: Race Condition (n8n Results Before Conversation)
- [ ] No crash if cache doesn't exist
- [ ] Details appear once conversation arrives
- [ ] Loading state shown appropriately

#### ✅ EC3: Page Refresh
- [ ] If API returns `preHandoff.n8n`: Full data restored
- [ ] If API doesn't return `preHandoff.n8n`: Summary shown, details unavailable
- [ ] Clear message if details unavailable after refresh

#### ✅ EC4: Partial Data
- [ ] Works if `automation` exists but `automationDetails` doesn't
- [ ] Works if result has no price or source
- [ ] Works if meta data is missing

#### ✅ EC5: Network Issues
- [ ] Socket disconnect doesn't break automation display
- [ ] Existing data remains visible during disconnect
- [ ] Reconnection resumes updates

---

## Risks & Edge Cases

### Risk 1: API Does NOT Return preHandoff.n8n
**Severity:** Medium  
**Likelihood:** Unknown (need to verify with backend)

**Impact:**
- Automation details lost on page refresh
- Users must rely on summary badge only after refresh
- Detail panel shows "Details unavailable after refresh"

**Mitigation:**
1. **Best case:** Backend team adds `preHandoff.n8n` to API response → Full solution
2. **Fallback:** Display clear message: "Automation details will appear for new conversations"
3. **Documentation:** Note limitation in Phase 4 docs

**Action Item:** ❗ **VERIFY with backend team before implementation starts**

---

### Risk 2: Event Ordering (Race Conditions)
**Severity:** Low  
**Likelihood:** High (n8n results may arrive before conversation:new)

**Scenarios:**
- `conversation:n8n_results` arrives before `conversation:new`
- `conversation:updated` overwrites newer data with older data

**Mitigation:**
- Socket handler checks if cache exists before updating
- If cache doesn't exist, event ignored (details will load on next update)
- Merge strategy: Never overwrite existing data with undefined
- Show loading state if summary exists but details don't (max 10s)

**Testing:** Simulate delayed events in dev environment

---

### Risk 3: Old Conversations Without Automation
**Severity:** Low  
**Likelihood:** 100% (existing conversations pre-date automation)

**Impact:**
- Badge not shown (expected)
- Panel not shown (expected)
- Filter: Appear in "All" only

**Mitigation:**
- Conditional rendering: `if (conversation.automation)` before showing badge/panel
- No errors or warnings for missing data
- Graceful degradation

**Testing:** Test with mix of old and new conversations

---

### Risk 4: Socket Connection Issues
**Severity:** Medium  
**Likelihood:** Low (network issues, server restart)

**Impact:**
- Real-time updates stop
- Automation details may not appear for new conversations
- List may become stale

**Mitigation:**
- Existing socket reconnection logic handles this
- User can manually refresh page
- Future enhancement: Connection status indicator (Phase 5+)

**Testing:** Simulate socket disconnect/reconnect

---

### Risk 5: Performance with Many Results
**Severity:** Low  
**Likelihood:** Low (backend limits to 3 results)

**Impact:**
- If backend sends > 3 results, UI may be cluttered

**Mitigation:**
- Frontend limits display to 3 results: `results.slice(0, 3)`
- Note in code: "Backend should limit to 3, but we enforce client-side too"

---

### Risk 6: i18n Translation Quality
**Severity:** Low  
**Likelihood:** Medium (Hebrew translations may need review)

**Impact:**
- Unclear or incorrect Hebrew translations
- Awkward RTL layout

**Mitigation:**
- Initial translations done with best effort
- Mark for review by native Hebrew speaker
- Easy to update translation files later

**Action Item:** Request Hebrew translation review from team member

---

### Edge Case 1: automation.failure === true AND n8nStatus === 'success_*'
**Scenario:** Conflicting status indicators

**Handling:**
- `failure` field takes precedence (it's the explicit error flag)
- Badge shows "Auto failed" (red)
- Panel shows error details if available

---

### Edge Case 2: Multiple conversation:n8n_results Events
**Scenario:** Backend sends duplicate events (retries, bugs)

**Handling:**
- Each event overwrites previous `automationDetails`
- Last event wins
- No accumulation of duplicate data
- Idempotent: Same data multiple times = same result

---

### Edge Case 3: Very Long Error Messages
**Scenario:** `errorMessage` is 500+ characters

**Handling:**
- Panel scrolls vertically
- Max-height: `max-h-48` with `overflow-y-auto`
- Doesn't break layout

---

### Edge Case 4: Invalid canonicalUrl
**Scenario:** Result has `canonicalUrl: null` or invalid URL

**Handling:**
- Check if URL exists before rendering link
- If missing: Show title but no clickable link
- No crash or broken UI

**Code:**
```typescript
{result.canonicalUrl && (
  <a href={result.canonicalUrl} target="_blank" rel="noopener noreferrer">
    View Details →
  </a>
)}
```

---

### Edge Case 5: Missing Translations
**Scenario:** Translation key doesn't exist in locale file

**Handling:**
- i18next displays translation key as fallback
- Easy to identify missing translations in testing
- No crash

---

## Testing Strategy

### Manual Testing Checklist

#### Conversation List - Badge Display

- [ ] **Test 1:** New conversation with `autoResultsSent: true`
  - Expected: Green "✅ Auto sent" badge appears
  
- [ ] **Test 2:** New conversation with `failure: true`
  - Expected: Red "⚠️ Auto failed" badge appears
  
- [ ] **Test 3:** New conversation with `n8nStatus: 'success_empty'`
  - Expected: Blue "ℹ️ Auto empty" badge appears
  
- [ ] **Test 4:** New conversation with `n8nStatus: 'disabled'`
  - Expected: Gray "⛔ Auto disabled" badge appears
  
- [ ] **Test 5:** Old conversation (no automation field)
  - Expected: No automation badge appears, no errors

#### Conversation List - Filtering

- [ ] **Test 6:** Click "All" filter
  - Expected: All conversations displayed (including old ones)
  
- [ ] **Test 7:** Click "Auto sent" filter
  - Expected: Only conversations with `autoResultsSent: true` displayed
  
- [ ] **Test 8:** Click "Auto failed" filter
  - Expected: Only conversations with `failure: true` displayed
  
- [ ] **Test 9:** Click "Auto empty" filter
  - Expected: Only conversations with `n8nStatus: 'success_empty'` displayed
  
- [ ] **Test 10:** Click "Auto disabled" filter
  - Expected: Only conversations with `n8nStatus: 'disabled'` displayed
  
- [ ] **Test 11:** Combine workflow filter "In Progress" + automation filter "Auto sent"
  - Expected: Only in-progress conversations with auto-sent results displayed

#### Conversation Detail - Panel Display

- [ ] **Test 12:** Open conversation with automation data and 3 results
  - Expected: Panel shows success variant with 3 result cards
  
- [ ] **Test 13:** Open conversation with `n8nStatus: 'success_empty'`
  - Expected: Panel shows "No results found" empty state
  
- [ ] **Test 14:** Open conversation with `failure: true`
  - Expected: Panel shows error variant with error code and message
  
- [ ] **Test 15:** Open conversation with `n8nStatus: 'disabled'`
  - Expected: Panel shows disabled variant with informational message
  
- [ ] **Test 16:** Open conversation with automation summary but no details yet
  - Expected: Panel shows "Processing..." loading state
  
- [ ] **Test 17:** Open old conversation (no automation data)
  - Expected: No automation panel appears

#### Conversation Detail - Panel Interaction

- [ ] **Test 18:** Click "View Details" link on result card
  - Expected: Opens `canonicalUrl` in new tab
  
- [ ] **Test 19:** Click collapse button
  - Expected: Panel collapses, only header visible
  
- [ ] **Test 20:** Click expand button
  - Expected: Panel expands, full content visible
  
- [ ] **Test 21:** Collapse panel, navigate away, return
  - Expected: Panel remains collapsed (state persisted)

#### Socket Events

- [ ] **Test 22:** Receive `conversation:new` with automation data
  - Expected: Conversation appears in list with correct badge
  
- [ ] **Test 23:** Receive `conversation:updated` changing automation status
  - Expected: Badge updates in list, panel updates in detail
  
- [ ] **Test 24:** Receive `conversation:n8n_results` event
  - Expected: Detail panel updates with full results
  
- [ ] **Test 25:** Receive `conversation:n8n_results` before `conversation:new`
  - Expected: No crash, details appear once conversation arrives

#### Internationalization & RTL

- [ ] **Test 26:** Switch to Hebrew language
  - Expected: All automation text translated to Hebrew
  
- [ ] **Test 27:** Verify RTL layout in Hebrew
  - Expected: Badges align right, text direction correct, no layout breaks
  
- [ ] **Test 28:** Filter pills in Hebrew
  - Expected: Pills read right-to-left, active state works

#### Responsive Design

- [ ] **Test 29:** View on mobile (375px width)
  - Expected: Filter pills wrap or scroll horizontally
  
- [ ] **Test 30:** View automation panel on mobile
  - Expected: Result cards simplified, no horizontal overflow
  
- [ ] **Test 31:** View on tablet (768px width)
  - Expected: Layout adapts appropriately, all content accessible

#### Edge Cases

- [ ] **Test 32:** Page refresh after opening conversation with automation details
  - Expected: If API returns data, panel shows immediately. If not, shows "Details unavailable after refresh."
  
- [ ] **Test 33:** Result card with missing price/source
  - Expected: Card displays title and link, omits missing fields
  
- [ ] **Test 34:** Very long error message (500+ chars)
  - Expected: Panel shows error with vertical scroll
  
- [ ] **Test 35:** Invalid canonicalUrl (null/undefined)
  - Expected: No link shown, no crash

---

### Automated Testing (Future)

**Note:** Automated tests are NOT part of this phase but recommended for future.

**Suggested Test Coverage:**
1. Unit tests for `filterByAutomation()` function
2. Unit tests for `AutomationBadge` component (all variants)
3. Unit tests for `AutomationPanel` component (all variants)
4. Integration test for socket event handling
5. E2E test for filter interaction

**Tools:** Vitest + React Testing Library + Playwright

---

## Appendix A: Design Tokens

### Colors

**Automation Badge:**
```css
/* Auto Sent (Green) */
--badge-sent-bg: #D1FAE5;        /* emerald-50 */
--badge-sent-text: #047857;      /* emerald-700 */
--badge-sent-border: #6EE7B7;    /* emerald-200 */

/* Auto Failed (Red) */
--badge-failed-bg: #FEE2E2;      /* rose-50 */
--badge-failed-text: #BE123C;    /* rose-700 */
--badge-failed-border: #FECACA;  /* rose-200 */

/* Auto Empty (Blue) */
--badge-empty-bg: #EFF6FF;       /* blue-50 */
--badge-empty-text: #2563EB;     /* blue-600 */
--badge-empty-border: #BFDBFE;   /* blue-200 */

/* Auto Disabled (Gray) */
--badge-disabled-bg: #F9FAFB;    /* gray-50 */
--badge-disabled-text: #4B5563;  /* gray-600 */
--badge-disabled-border: #E5E7EB;/* gray-200 */
```

**Automation Panel:**
```css
/* Panel */
--panel-bg: #FFFFFF;             /* white */
--panel-border: #E5E7EB;         /* gray-200 */

/* Result Card */
--card-bg: #FFFFFF;              /* white */
--card-border: #E5E7EB;          /* gray-200 */
--card-hover-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Text */
--text-primary: #111827;         /* gray-900 */
--text-secondary: #6B7280;       /* gray-600 */
--text-link: #2563EB;            /* blue-600 */
--text-link-hover: #1D4ED8;      /* blue-700 */
```

### Typography

**Badge:**
- Font size: `12px` (`text-xs`)
- Font weight: `500` (`font-medium`)
- Line height: `16px`

**Panel Title:**
- Font size: `16px` (`text-base`)
- Font weight: `600` (`font-semibold`)

**Panel Body:**
- Font size: `14px` (`text-sm`)
- Font weight: `400` (`font-normal`)

**Result Card Title:**
- Font size: `14px` (`text-sm`)
- Font weight: `600` (`font-semibold`)

**Result Card Meta:**
- Font size: `12px` (`text-xs`)
- Font weight: `400` (`font-normal`)

### Spacing

**Badge:**
- Padding: `8px 10px` (`px-2.5 py-2`)
- Gap from siblings: `6px` (`gap-1.5`)

**Panel:**
- Padding: `16px` (`p-4`)
- Margin bottom: `16px` (`mb-4`)

**Result Card:**
- Padding: `16px` (`p-4`)
- Gap between cards: `12px` (`gap-3`)

**Filter Pills:**
- Padding: `6px 12px` (`px-3 py-1.5`)
- Gap between pills: `8px` (`gap-2`)

### Border Radius

- Badge: `6px` (`rounded-md`)
- Panel: `8px` (`rounded-lg`)
- Result Card: `8px` (`rounded-lg`)
- Filter Pill: `9999px` (`rounded-full`)

---

## Appendix B: Example Payloads

### conversation:new / conversation:updated

```json
{
  "id": "conv_123abc",
  "customerId": "user_456def",
  "status": "open",
  "workflowStatus": "new",
  "automation": {
    "n8nStatus": "success_with_results",
    "autoResultsSent": true,
    "failure": false
  },
  "lastMessageAt": "2025-12-22T10:30:00Z",
  "createdAt": "2025-12-22T10:25:00Z",
  "updatedAt": "2025-12-22T10:30:00Z"
}
```

### conversation:n8n_results

```json
{
  "conversationId": "conv_123abc",
  "status": "success_with_results",
  "results": [
    {
      "title": "Front Bumper for Toyota Corolla 2020",
      "price": "$250",
      "source": "PartSource Inc.",
      "canonicalUrl": "https://partsource.com/parts/front-bumper-corolla-2020"
    },
    {
      "title": "OEM Front Bumper (Original)",
      "price": "$420",
      "source": "Toyota Dealer",
      "canonicalUrl": "https://toyota-parts.com/oem-bumper-123"
    },
    {
      "title": "Aftermarket Bumper - Compatible",
      "price": "$180",
      "source": "AutoParts.com",
      "canonicalUrl": "https://autoparts.com/bumper-corolla"
    }
  ],
  "meta": {
    "duration": 1200,
    "attempts": 1,
    "timestamp": "2025-12-22T10:30:00Z"
  }
}
```

### conversation:n8n_results (Failed)

```json
{
  "conversationId": "conv_789ghi",
  "status": "failed",
  "errorCode": "VALIDATION_ERROR",
  "errorMessage": "Missing required field: vehicle plate number",
  "meta": {
    "duration": 800,
    "attempts": 2,
    "timestamp": "2025-12-22T10:32:00Z"
  }
}
```

---

## Next Steps

### ✅ Planning Complete - Awaiting Approval

This document is now **COMPLETE** and ready for review.

**Before implementation:**
1. ❗ **CRITICAL:** Verify with backend team: Does `GET /agent/conversations/:id` return `preHandoff.n8n` data?
2. Review UI/UX designs with team (screenshots/mockups if needed)
3. Confirm implementation approach and priorities
4. Get approval to proceed

**After approval:**
1. Create feature branch: `feature/phase4-automation-ux`
2. Implement Phase 1 (Foundation)
3. Commit and push after each phase
4. Open PR when all phases complete
5. Address review feedback
6. Merge to `main` branch

**Estimated Timeline:** 10-15 hours (2 days full-time)

---

**Document Status:** 📋 **READY FOR REVIEW**  
**Next Action:** Await approval before implementation  
**Questions/Concerns:** Tag @frontend-team for discussion

---

*End of Phase 4 Implementation Plan*

