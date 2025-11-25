# Agent Dashboard Frontend

A modern React-based dashboard for customer service agents to manage conversations and messages in real-time.

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query (React Query)** - Data fetching and caching
- **react-i18next** - Internationalization (English + Hebrew with RTL support)
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - HTTP client
- **date-fns** - Date formatting utilities

## Features

### Phase 1 (Current)

- ✅ User authentication (login/logout)
- ✅ Protected routes
- ✅ Two-column dashboard layout (conversations list + active conversation)
- ✅ Real-time Socket.IO connection
- ✅ Conversation management:
  - View open conversations
  - Select and view conversation details
  - View message history
  - Send replies
  - Close conversations
- ✅ Internationalization (English/Hebrew) with RTL support
- ✅ Language switcher

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend repo)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Alenwuhl/agent_panel_chatbot.git
cd agent_panel_chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your backend URLs:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── api/                    # API clients
│   ├── client.ts          # Axios instance with interceptors
│   ├── authApi.ts         # Authentication endpoints
│   └── agentApi.ts        # Agent/conversation endpoints
├── components/
│   ├── common/            # Reusable components
│   │   ├── LanguageSwitcher.tsx
│   │   └── LoadingSpinner.tsx
│   ├── conversations/     # Conversation-related components
│   │   ├── ConversationList.tsx
│   │   ├── ConversationListItem.tsx
│   │   └── ConversationView.tsx
│   ├── layout/            # Layout components
│   │   ├── DashboardLayout.tsx
│   │   └── Header.tsx
│   └── messages/          # Message-related components
│       ├── MessageBubble.tsx
│       ├── MessageInput.tsx
│       └── MessageList.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.tsx       # Authentication context and hook
│   ├── useConversations.ts # Conversation queries and mutations
│   └── useSocket.ts      # Socket.IO event listener hook
├── i18n/                 # Internationalization
│   ├── index.ts
│   └── locales/
│       ├── en/common.json
│       └── he/common.json
├── pages/                # Page components
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── router/               # Routing configuration
│   ├── AppRouter.tsx
│   └── ProtectedRoute.tsx
├── services/             # External services
│   └── socketClient.ts   # Socket.IO client wrapper
├── types/                # TypeScript type definitions
│   ├── agent.ts
│   ├── conversation.ts
│   └── message.ts
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Default Login Credentials

```
Email: admin@partscanner.co.il
Password: changeme123
```

## Backend API Contract

The frontend expects the following backend endpoints:

### Authentication
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current agent profile

### Agent API (requires JWT)
- `GET /agent/conversations` - List conversations
- `GET /agent/conversations/:id` - Get conversation details
- `GET /agent/conversations/:id/messages` - Get messages
- `POST /agent/conversations/:id/reply` - Send a reply
- `PATCH /agent/conversations/:id/close` - Close conversation

### Socket.IO Events
- `conversation:new` - New conversation created
- `conversation:updated` - Conversation updated
- `message:new` - New message received

## Development Notes

### RTL Support
The app automatically switches to RTL (right-to-left) layout when Hebrew is selected. This is handled by setting the `dir` attribute on the document root.

### Authentication Flow
1. User logs in via `/login`
2. JWT token is stored in `localStorage`
3. Token is automatically added to all API requests via Axios interceptor
4. Socket.IO connection is established with the token
5. Protected routes check for valid token before rendering

### Real-time Updates
Socket.IO connection is established after successful login. For Phase 1, events are logged to console. Future phases will update React Query cache from these events.

## Future Enhancements

- Mobile-responsive conversation view toggle
- Conversation search and filtering
- Pagination for conversations and messages
- Real-time cache updates from Socket.IO events
- Message status indicators (sent, delivered, read)
- File attachments support
- Agent status management
- Conversation assignment
- Performance metrics dashboard

## License

Private - All rights reserved
