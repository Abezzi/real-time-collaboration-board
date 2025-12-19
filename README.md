# Real-Time Collaboration Board

Real-time Collaboration Board with Vue3 + Socket.io

## Project Architecture

- Runtime: NodeJS with Express API + Vite
- Language: TypeScript (frontend), Javascript (Backend)
- Database: SQLite
- Front-end: Vue3, Vite, Quasar Framework, Pinia
- Back-end: NodeJS, Socket.io

## Usage

[Demostration Video](https://youtu.be/G9pMARgXZo0) <- Redirects you to youtube

## Setup

### Prerequisites

- Node.js 16+
- QuasarCLI
- SQLite
- NPM 6+

to install Quasar CLI run this command anywhere in your computer to install the CLI

```bash
npm i -g @quasar/cli
```

### Installation and how to run

1. Clone the repo

```sh
git clone git@github.com:Abezzi/real-time-collaboration-board.git
```

2. Extract the folder
3. Move to the folder

```sh
cd real-time-collaboration-board
```

4. Install NPM packages

```bash
npm install
```

5. In one terminal run the client:

```sh
quasar dev
```

6. server should be running in http://localhost:9000

7. On a second terminal or tab run the server (inside the root project folder)

```sh
npm run server
```

## Optional

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

## Tests

- Run once

```sh
npm run test
```

- Watch mode (recommended during development)

```sh
npm run test:watch
```

- Browser UI

```sh
npm run test:ui
```

## Available Events

### Server to Client

- note:created
- note:updated
- note:deleted
- note:commented
- presence:users
- server:error
- note:edit:started
- note:edit:ended
- note:edit:locked

### Client to Server

- joinBoard
- leaveBoard
- note:create
- note:update
- note:delete
- note:comment
- note:edit:start
- note:edit:end

## Project Tree

```sh
├── app.db                          # SQLite database file
├── eslint.config.js                # ESLint configuration for code linting and formatting
├── index.html                      # Main HTML entry point for the Quasar app
├── package.json                    # Project metadata, dependencies, and scripts
├── package-lock.json               # Locked dependency versions
├── postcss.config.js               # PostCSS configuration (used by Quasar/Vite)
├── public
│   ├── favicon.ico                 # Default favicon
│   └── icons                       # Various favicon sizes for different devices
├── quasar.config.ts                # Quasar framework configuration
├── README.md                       # Project documentation and setup instructions
├── server
│   ├── app.db                      # Server-side SQLite database
│   ├── controllers
│   │   ├── authController.js       # Authentication logic (login, register)
│   │   ├── boardController.js      # Board CRUD and collaborator management
│   │   ├── noteController.js       # Note CRUD, comments, and permission checks
│   │   └── userController.js       # User-related operations
│   ├── db.js                       # SQLite database connection and setup
│   ├── index.js                    # Main server entry point (Express + Socket.io setup)
│   ├── middleware
│   │   └── auth.js                 # JWT authentication middleware for routes and sockets
│   ├── routes
│   │   ├── auth.js                 # Auth API routes (login/register)
│   │   ├── boards.js               # Board API routes
│   │   ├── notes.js                # Note API routes (initial load)
│   │   └── users.js                # User-related API routes
│   ├── socket
│   │   └── index.js                # Socket.io real-time logic
│   └── utils
│       └── access.js               # Helper functions for role checks (owner/editor/viewer)
├── src
│   ├── App.vue                     # Root Vue component
│   ├── assets
│   │   └── quasar-logo-vertical.svg # Default Quasar logo asset
│   ├── boot
│   │   ├── axios.ts                # Axios instance with auth interceptors
│   │   ├── i18n.ts                 # Internationalization setup
│   │   ├── pinia.ts                # Pinia store initialization
│   │   └── socket.ts               # Socket.io client connection setup
│   ├── components
│   │   ├── EssentialLink.vue       # Reusable link component (drawer)
│   │   ├── ExampleComponent.vue    # Example or placeholder component
│   │   ├── models.ts               # Type definitions for components
│   │   └── __tests__
│   │       ├── NoteCard.spec.ts    # Vitest unit tests for NoteCard
│   │       └── NoteEditDialog.spec.ts # Vitest unit tests for edit modal
│   ├── css
│   │   ├── app.scss                # Global app styles
│   │   └── quasar.variables.scss   # Quasar theme variables override
│   ├── env.d.ts                    # TypeScript environment declarations
│   ├── i18n
│   │   ├── en-US
│   │   │   └── index.ts            # English language pack
│   │   └── index.ts                # i18n configuration and exports
│   ├── layouts
│   │   ├── AuthLayout.vue          # Layout for login/register pages
│   │   └── MainLayout.vue          # Main app layout (header, drawer, etc.)
│   ├── pages
│   │   ├── BoardPage.vue           # Board list / management page
│   │   ├── BoardView.vue           # Main canvas page (real-time notes, drag, edit modal)
│   │   ├── ErrorNotFound.vue       # 404 page
│   │   ├── HomePage.vue            # Home / dashboard
│   │   ├── IndexPage.vue           # Landing page
│   │   └── LoginPage.vue           # Login / authentication page
│   ├── router
│   │   ├── index.ts                # Vue Router instance and setup
│   │   └── routes.ts               # Route definitions
│   ├── services
│   │   └── SocketService.ts        # Typed Socket.io client wrapper (emit/on/off)
│   ├── stores
│   │   ├── auth.ts                 # Pinia store for authentication (user, token)
│   │   ├── index.ts                # Pinia store exports
│   │   ├── notesStore.ts           # Pinia store for notes (real-time mutations, presence, edit locks)
│   │   └── __tests__
│   │       └── notesStore.spec.ts  # Vitest unit tests for notesStore real-time logic
│   ├── tests
│   │   └── setup.ts                # Global Vitest setup (Quasar plugins, Pinia testing)
│   └── types
│       ├── draggable.ts            # Types for drag events
│       └── socketEvents.ts         # TypeScript interfaces for socket events (Note, Client/Server events)
├── test
│   └── vitest
│       └── __tests__
│           └── demo                # Example or demo tests
├── todo.md                         # Project TODO list
├── tsconfig.json                   # TypeScript configuration (paths, strict mode)
└── vitest.config.ts                # Vitest configuration (aliases, environment, plugins)
```

# Diagram

User A (Client) Server User B (Client)

                  ┌─────────────────────────────┐                       ┌─────────────────────────────┐
                  │ Client → Server Events      │                       │ Server → Client Events      │
                  ├─────────────────────────────┤                       ├─────────────────────────────┤
                  │ joinBoard(boardId)          │ ◄─────────────────────│                             │
                  │ leaveBoard(boardId)         │ ◄─────────────────────│                             │
                  │ note:create(...)            │ ─────────────────────►│ note:created(fullNote)      │ ─────────────────────►
                  │ note:update(partial)        │ ─────────────────────►│ note:updated(fullNote)      │ ─────────────────────►
                  │ note:delete({noteId})       │ ─────────────────────►│ note:deleted({noteId})      │ ─────────────────────►
                  │ note:comment({text})        │ ─────────────────────►│ note:commented({comment})   │ ─────────────────────►
                  │ note:edit:start({noteId})   │ ─────────────────────►│ note:edit:started({editedBy})│ ───────────────────►
                  │ note:edit:end({noteId})     │ ─────────────────────►│ note:edit:ended({noteId})   │ ─────────────────────►
                  │                             │ ◄─────────────────────│ note:edit:locked({editedBy})│ (only to requester)
                  │                             │ ◄─────────────────────│ presence:users([users])     │ ─────────────────────►
                  │                             │ ◄─────────────────────│ server:error({message})     │ ─────────────────────►
                  └─────────────────────────────┘                       └─────────────────────────────┘

Key:

- ─────► : Direct emit (often to room or specific socket)
- ◄───── : Response/broadcast back
- All real-time updates (create/update/delete/comment/presence/edit lock) are broadcast to the board room (`board:${boardId}`)
- `note:edit:locked` is sent **only to the requester** if the note is already being edited
- `joinBoard` triggers initial notes load + presence update
- `leaveBoard` triggers presence update

# Future Improvements

- improve Login/register view, adding validations, email authentication
- redirect to login when the user isn't logged
- edit profile
- add a chat functionality
- add a team funcionality to share notes between all the members without needing to add them as collaborators one by one
- code modularity, could divide the view logic in smaller components to re-use them in the future
- test integration, should have more unit-tests to make the code future proof
- be able to add all kinds of things to the notes, like videos, xls files, etc.
- notes history
- should improve UI/UX, has the basic functionality but is not production ready
- add themes, dark mode.
- add stadistics or information or a welcome message in the home page (right now is blank)
- deploy the app to netlify or vercel

# Technical decisions and trade-off

- opted for using Quasar Framework since it has more components ready to use since I had a short amount of time to complete the MVP
- created my own express back-end and made it modular
- made my own way of dragging the notes instead of using a library like vue-draggable-next so i had more control over the functionality but took more time to implement it
- invested all my time in the core functionalities, had no time for tests. in a real life project I would use test from the beginning.
