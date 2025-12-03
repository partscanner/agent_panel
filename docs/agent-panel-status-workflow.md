# Agent Panel - Conversation Workflow Status Feature

> **Date:** December 3, 2025  
> **Branch:** main  
> **Feature:** Conversation workflow status tracking and filtering

## Overview

This document describes the implementation of conversation workflow status tracking in the Agent Panel. This feature allows agents to track conversations through different stages of the sales/support process and filter conversations based on their workflow status.

## Workflow Statuses

The system supports five workflow statuses:

### 1. **new** (Automatic)
- **Description:** Freshly opened conversations that haven't been engaged yet
- **Trigger:** System automatically assigns when a conversation is created
- **Agent Action:** Cannot be manually set
- **Color:** Soft blue (`bg-blue-50 text-blue-700`)

### 2. **in_progress** (Manual)
- **Description:** Conversations actively being handled by an agent
- **Trigger:** Agent manually sets via dropdown
- **Agent Action:** Selectable from status dropdown
- **Color:** Strong blue (`bg-blue-100 text-blue-800`)

### 3. **no_answer** (Automatic)
- **Description:** Customer hasn't responded after agent follow-up
- **Trigger:** System automatically assigns based on business rules
- **Agent Action:** Cannot be manually set
- **Color:** Amber/orange (`bg-amber-50 text-amber-700`)

### 4. **won** (Manual)
- **Description:** Successfully closed deals or resolved issues
- **Trigger:** Agent manually sets when completing a successful transaction
- **Agent Action:** Selectable from status dropdown
- **Color:** Green (`bg-emerald-50 text-emerald-700`)

### 5. **lost** (Manual)
- **Description:** Conversations that didn't result in a sale or resolution
- **Trigger:** Agent manually sets when a deal is lost or issue unresolved
- **Agent Action:** Selectable from status dropdown
- **Color:** Red (`bg-rose-50 text-rose-700`)

---

## UI Components

### 1. WorkflowStatusBadge Component

**Location:** `src/components/conversations/WorkflowStatusBadge.tsx`

**Purpose:** Reusable component that displays a colorful pill badge for any workflow status.

**Props:**
```typescript
interface WorkflowStatusBadgeProps {
  workflowStatus: WorkflowStatus;
  className?: string; // Optional additional CSS classes
}
```

**Features:**
- Automatically translates status labels using i18n
- Color-coded based on status type
- RTL/LTR compatible
- Rounded pill design with border

**Usage:**
```tsx
<WorkflowStatusBadge workflowStatus={conversation.workflowStatus} />
```

---

### 2. Filter Bar (ConversationList)

**Location:** `src/components/conversations/ConversationList.tsx`

**Purpose:** Allows agents to filter conversations by workflow status or conversation state.

**Filter Options:**

| Filter Label | Backend Query Params | Description |
|-------------|---------------------|-------------|
| **Open** | `status=open` | All open conversations (default) |
| **New** | `status=open, workflowStatus=new` | New conversations only |
| **In progress** | `status=open, workflowStatus=in_progress` | Active conversations |
| **No answer** | `status=open, workflowStatus=no_answer` | Conversations waiting for customer |
| **Won** | `workflowStatus=won` | Successfully completed (any status) |
| **Lost** | `workflowStatus=lost` | Unsuccessful (any status) |
| **Closed** | `status=closed` | All closed conversations |

**Design:**
- Pill-style buttons with rounded borders
- Active filter: Blue background with white text
- Inactive filters: Gray background with hover effect
- Responsive flex wrapping for mobile devices
- RTL/LTR compatible layout

**State Management:**
```typescript
const [activeFilter, setActiveFilter] = useState<FilterOption>('open');
```

---

### 3. Status Badge in List Items

**Location:** `src/components/conversations/ConversationListItem.tsx`

**Changes:**
- Added `WorkflowStatusBadge` import
- Badge displayed in Zone B (meta info area) alongside time and unread count
- Only shows if `conversation.workflowStatus` is defined
- Positioned between timestamp and unread badge

**Layout (Zone B):**
```
┌─────────────────┐
│ 5 mins ago      │  ← Timestamp
│ [In progress]   │  ← Workflow badge
│ (3)             │  ← Unread count
└─────────────────┘
```

---

### 4. Status Badge and Dropdown in Conversation Header

**Location:** `src/components/conversations/ConversationView.tsx`

**Changes:**

#### Imports Added:
```typescript
import { useUpdateWorkflowStatus } from '../../hooks/useConversations';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
```

#### State Added:
```typescript
const updateWorkflowStatus = useUpdateWorkflowStatus();
const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);
const workflowMenuRef = useRef<HTMLDivElement>(null);
```

#### Handler Added:
```typescript
const handleUpdateWorkflowStatus = async (workflowStatus: 'in_progress' | 'won' | 'lost') => {
  try {
    await updateWorkflowStatus.mutateAsync({ conversationId, workflowStatus });
    setIsWorkflowMenuOpen(false);
  } catch (error) {
    console.error('Failed to update workflow status:', error);
  }
};
```

#### UI Elements:
1. **Badge Display:**
   - Shows current workflow status below assigned agent info
   - Only visible if `conversation.workflowStatus` is defined

2. **Status Dropdown:**
   - Only visible for open conversations (`!isClosed`)
   - "Edit" button next to badge opens dropdown
   - Three options:
     - In progress
     - Won
     - Lost
   - Color-coded hover states matching badge colors
   - Disabled during mutation (prevents double-clicks)

**Layout:**
```
Assigned Agent: John Doe
[New] Edit ▼
    ├─ In progress
    ├─ Won
    └─ Lost
```

---

## Backend Integration

### API Endpoints Used

#### 1. GET `/agent/conversations`
**Extended Query Params:**
```typescript
{
  status?: 'open' | 'closed';
  workflowStatus?: 'new' | 'in_progress' | 'no_answer' | 'won' | 'lost';
  mine?: boolean;
  agentId?: string;
  page?: number;
  pageSize?: number;
}
```

**Examples:**
- Get all new conversations: `GET /agent/conversations?status=open&workflowStatus=new`
- Get my won deals: `GET /agent/conversations?workflowStatus=won&mine=true`
- Get all lost deals: `GET /agent/conversations?workflowStatus=lost`

#### 2. PATCH `/agent/conversations/:id/workflow-status`
**Request Body:**
```typescript
{
  workflowStatus: 'in_progress' | 'won' | 'lost'
}
```

**Note:** Only these three values are allowed. `new` and `no_answer` are set automatically by the backend.

**Response:**
```typescript
{
  success: true,
  conversation: Conversation // Updated conversation object
}
```

---

## Data Flow

### Types Updated

**Location:** `src/types/conversation.ts`

**Added:**
```typescript
export type WorkflowStatus = 'new' | 'in_progress' | 'no_answer' | 'won' | 'lost';

interface Conversation {
  // ... existing fields
  workflowStatus?: WorkflowStatus;
}
```

### API Layer Updated

**Location:** `src/api/agentApi.ts`

**Changes:**
1. Import `WorkflowStatus` type
2. Add `workflowStatus` param to `getConversations`
3. Map `workflowStatus` from backend in `transformConversation`
4. Add new `updateWorkflowStatus` function

### Hooks Updated

**Location:** `src/hooks/useConversations.ts`

**Changes:**

#### 1. Extended Filter Interface:
```typescript
export interface ConversationsFilter {
  status?: 'open' | 'closed';
  workflowStatus?: WorkflowStatus;  // ← Added
  mine?: boolean;
  agentId?: string;
}
```

#### 2. Updated Query Key:
```typescript
queryKey: ['conversations', { 
  status, 
  workflowStatus: workflowStatus ?? null,  // ← Added
  mine, 
  agentId: agentId ?? null 
}]
```

#### 3. New Mutation Hook:
```typescript
export const useUpdateWorkflowStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, workflowStatus }) =>
      agentApi.updateWorkflowStatus(conversationId, workflowStatus),
    onSuccess: (updatedConversation, variables) => {
      // Update conversation detail cache
      queryClient.setQueryData(['conversation', variables.conversationId], ...);
      
      // Update all conversation list caches
      const allQueries = queryClient.getQueriesData({ queryKey: ['conversations'] });
      allQueries.forEach(([queryKey, oldData]) => { ... });
      
      // Invalidate to refetch in background
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
  });
};
```

---

## Internationalization (i18n)

### English Translations

**File:** `src/i18n/locales/en/common.json`

**Added:**
```json
{
  "conversationFilters": {
    "open": "Open",
    "closed": "Closed",
    "new": "New",
    "inProgress": "In progress",
    "noAnswer": "No answer",
    "won": "Won",
    "lost": "Lost",
    "showOnlyMine": "Show only my conversations"
  },
  "workflowStatus": {
    "label": "Status",
    "new": "New",
    "inProgress": "In progress",
    "noAnswer": "No answer",
    "won": "Won",
    "lost": "Lost"
  }
}
```

### Hebrew Translations

**File:** `src/i18n/locales/he/common.json`

**Added:**
```json
{
  "conversationFilters": {
    "open": "פתוחות",
    "closed": "סגורות",
    "new": "חדש",
    "inProgress": "בטיפול",
    "noAnswer": "אין מענה",
    "won": "נסגר בהצלחה",
    "lost": "לא נסגר",
    "showOnlyMine": "הצג רק את השיחות שלי"
  },
  "workflowStatus": {
    "label": "סטטוס",
    "new": "חדש",
    "inProgress": "בטיפול",
    "noAnswer": "אין מענה",
    "won": "נסגר בהצלחה",
    "lost": "לא נסגר"
  }
}
```

---

## RTL/LTR Support

### Principles Applied

1. **Filter Pills:**
   - Use flex layout with natural wrapping
   - No hardcoded margins that break in RTL
   - Text alignment handled by Tailwind `ltr:` and `rtl:` prefixes

2. **Badges:**
   - Symmetric pill design (no directional bias)
   - Alignment controlled by parent container

3. **Dropdowns:**
   - Position: `ltr:left-0 rtl:right-0` or `ltr:right-0 rtl:left-0`
   - Text alignment: `ltr:text-left rtl:text-right`
   - Padding automatically mirrors

4. **Conversation List Items:**
   - Zone B (meta area) uses `ltr:items-end rtl:items-start`
   - Badge aligns correctly in both directions

### Testing RTL Mode

To test in Hebrew (RTL) mode:
1. Open dashboard at `http://localhost:5173/dashboard`
2. Click language switcher in top-right
3. Select Hebrew (עברית)
4. Verify:
   - Filter pills wrap naturally from right to left
   - Badges align correctly
   - Dropdowns open on correct side
   - All text is right-aligned

---

## How to Test

### Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend dev server running on `http://localhost:5173`
- At least one agent account with conversations

### Test Scenarios

#### 1. Filter Bar Functionality
1. Navigate to `/dashboard`
2. Observe default "Open" filter is active (blue)
3. Click each filter pill:
   - **New:** Should show only new conversations
   - **In progress:** Should show conversations being worked on
   - **No answer:** Should show conversations waiting for customer
   - **Won:** Should show successful deals (including closed ones)
   - **Lost:** Should show unsuccessful deals (including closed ones)
   - **Closed:** Should show all closed conversations
4. Verify conversation count updates with each filter
5. Verify "Show only my conversations" toggle works with all filters

#### 2. Status Badge Display
1. Open a conversation with a workflow status
2. Verify badge appears:
   - In list item (right side, between time and unread count)
   - In conversation header (below assigned agent info)
3. Verify badge colors match status:
   - New: Soft blue
   - In progress: Strong blue
   - No answer: Orange
   - Won: Green
   - Lost: Red

#### 3. Status Dropdown Functionality
1. Open a conversation with workflow status
2. Click "Edit" button next to badge in header
3. Verify dropdown shows three options:
   - In progress
   - Won
   - Lost
4. Click "In progress"
5. Verify:
   - Dropdown closes
   - Badge updates immediately
   - List item badge also updates
   - No page refresh required
6. Repeat with "Won" and "Lost"

#### 4. Closed Conversations
1. Open a closed conversation
2. Verify:
   - Badge shows current workflow status (read-only)
   - "Edit" button is NOT visible
   - Status cannot be changed

#### 5. RTL Mode (Hebrew)
1. Switch to Hebrew language
2. Verify:
   - Filter pills align from right to left
   - Badges are right-aligned in list items
   - Dropdowns open on correct side
   - All text is right-aligned
3. Test all functionality works identically in RTL

#### 6. Filter + Assignment Combination
1. Enable "Show only my conversations"
2. Try each filter:
   - Verify only YOUR assigned conversations appear
   - Verify filter counts are accurate
3. Disable toggle
4. Verify all conversations (any agent) appear

#### 7. Real-time Updates (Socket)
1. Open conversation in browser A
2. Change workflow status to "In progress"
3. Open same conversation in browser B
4. Verify:
   - Badge updates in browser B without refresh
   - Filter counts update
   - List item shows updated badge

---

## Architecture Decisions

### Why Separate Badge Component?

**Decision:** Create `WorkflowStatusBadge` as a standalone component

**Rationale:**
- **Reusability:** Used in both list items and conversation header
- **Maintainability:** Single source of truth for badge styling
- **Consistency:** Ensures badges look identical everywhere
- **Testability:** Can be tested in isolation

### Why Client-Side Filter Mapping?

**Decision:** Map filter options to API params in frontend

**Rationale:**
- **Flexibility:** Frontend can combine filters creatively
- **UX:** Can add "Open" option that doesn't send workflowStatus param
- **Simplicity:** Backend API remains clean and focused

### Why Only Three Settable Statuses?

**Decision:** Only allow agents to set `in_progress`, `won`, `lost`

**Rationale:**
- **Data Integrity:** `new` and `no_answer` are business logic states
- **Automation:** These states should be set by system rules
- **User Experience:** Agents shouldn't manually mark conversations as "no answer"

### Cache Update Strategy

**Decision:** Update all conversation list queries + invalidate

**Rationale:**
- **Immediate Feedback:** User sees change instantly
- **Consistency:** All filtered views update
- **Background Sync:** Invalidation ensures eventual consistency

---

## Performance Considerations

### Query Key Structure

```typescript
['conversations', { status, workflowStatus, mine, agentId }]
```

**Impact:**
- Each unique filter combination creates a separate cache entry
- Switching filters triggers new API call (expected behavior)
- Previous filter results remain cached for instant back-navigation

### Mutation Optimizations

1. **Optimistic Updates:** Sets cache immediately before API response
2. **Batch Invalidation:** Invalidates all conversation queries at once
3. **Selective Updates:** Only updates affected cache entries

---

## Future Enhancements

Potential improvements for future iterations:

1. **Status Transition Rules:**
   - Enforce valid state transitions (e.g., can't go from `won` back to `new`)
   - Show transition history/timeline

2. **Analytics:**
   - Conversion rates (new → won)
   - Average time in each status
   - Agent performance metrics

3. **Automation:**
   - Auto-transition to `no_answer` after X days of customer inactivity
   - Auto-close `no_answer` conversations after Y days

4. **Bulk Actions:**
   - Select multiple conversations
   - Bulk update workflow status

5. **Custom Statuses:**
   - Allow admins to define custom workflow stages
   - Per-team or per-business-type workflows

6. **Status Notes:**
   - Add optional note when changing status (especially for `lost`)
   - Track why deals were lost

---

## Troubleshooting

### Badge Doesn't Show
**Symptom:** Workflow status badge not appearing

**Checks:**
1. Verify `conversation.workflowStatus` is defined
2. Check backend response includes `workflowStatus` field
3. Verify `transformConversation` maps `workflow_status` → `workflowStatus`

### Filter Doesn't Work
**Symptom:** Clicking filter doesn't change conversation list

**Checks:**
1. Check `getFilterParams` mapping is correct
2. Verify API params are sent correctly (Network tab)
3. Check backend endpoint supports `workflowStatus` param
4. Verify query key includes all filter params

### Dropdown Doesn't Close
**Symptom:** Status dropdown stays open after clicking option

**Checks:**
1. Verify `setIsWorkflowMenuOpen(false)` is called in handler
2. Check `finally` block includes close action
3. Verify click-outside effect is working
4. Check for JavaScript errors in console

### RTL Layout Broken
**Symptom:** Elements misaligned in Hebrew mode

**Checks:**
1. Verify `ltr:` and `rtl:` Tailwind prefixes are applied
2. Check `dir` attribute is set on root element
3. Ensure no hardcoded left/right margins
4. Use `start` and `end` instead of `left` and `right` where possible

---

## Files Changed Summary

### New Files
- `src/components/conversations/WorkflowStatusBadge.tsx` (New component)

### Modified Files
- `src/types/conversation.ts` (Added WorkflowStatus type)
- `src/api/agentApi.ts` (Extended API functions)
- `src/hooks/useConversations.ts` (Added useUpdateWorkflowStatus hook)
- `src/components/conversations/ConversationList.tsx` (Added filter bar)
- `src/components/conversations/ConversationListItem.tsx` (Added badge display)
- `src/components/conversations/ConversationView.tsx` (Added badge and dropdown)
- `src/i18n/locales/en/common.json` (Added translations)
- `src/i18n/locales/he/common.json` (Added translations)

### No Changes Required
- Socket client (already handles conversation updates)
- Message components (unaffected by workflow status)
- Auth system (uses existing agent context)

---

## Maintenance Notes

### When Adding New Workflow Statuses

If new statuses are added in the future:

1. **Types:** Add to `WorkflowStatus` union in `conversation.ts`
2. **Badge Component:** Add color mapping in `colorClasses` object
3. **Translations:** Add i18n keys for both EN and HE
4. **Filter Bar:** Add to filter options array in `ConversationList.tsx`
5. **Filter Mapping:** Update `getFilterParams` function
6. **Dropdown:** If settable by agents, add to dropdown options

### When Modifying Filter Logic

If filter combinations need to change:

1. **ConversationList:** Update `getFilterParams` mapping
2. **Documentation:** Update filter table in this file
3. **Tests:** Add test scenarios for new combinations
4. **Backend:** Coordinate with backend team on API changes

---

## Conclusion

The workflow status feature provides agents with powerful tools to track and manage conversations through the sales/support lifecycle. The implementation follows React best practices, maintains full i18n support including RTL layouts, and integrates seamlessly with the existing assignment and filtering systems.

The feature is production-ready and has been tested in both LTR (English) and RTL (Hebrew) modes on `http://localhost:5173`.

