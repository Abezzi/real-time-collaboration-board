import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:9000',
    methods: ['GET', 'POST'],
  },
});

const db = new Database('app.db', { verbose: console.log });

app.use(express.json());
app.use(cors({ origin: 'http://localhost:9000' }));

// Safely add columns if they don't exist
function addColumnIfNotExists(table, column, definition) {
  const pragma = db.pragma(`table_info(${table})`);
  const exists = pragma.some((col) => col.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${column} to table ${table}`);
  }
}

// Initialize DB tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS board_users (
    board_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    PRIMARY KEY (board_id, user_id),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migrate existing boards table if needed
addColumnIfNotExists('boards', 'description', 'TEXT');
addColumnIfNotExists('boards', 'owner_id', 'INTEGER NOT NULL DEFAULT 1');

const boardsWithoutOwner = db
  .prepare('SELECT id FROM boards WHERE owner_id IS NULL OR owner_id = 0')
  .all();
if (boardsWithoutOwner.length > 0) {
  console.log(`Migrating ${boardsWithoutOwner.length} existing boards to set owner_id`);
  const updateStmt = db.prepare('UPDATE boards SET owner_id = 1 WHERE id = ?');
  for (const board of boardsWithoutOwner) {
    updateStmt.run(board.id);
  }
}

const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword);
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Username already taken' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// Socket.io authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// GET /api/boards - list owned + collaborated
app.get('/api/boards', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const owned = db
    .prepare(
      `
    SELECT id, title AS name, description, 'owner' AS role
    FROM boards WHERE owner_id = ?
  `,
    )
    .all(userId);

  const collaborated = db
    .prepare(
      `
    SELECT b.id, b.title AS name, b.description, bu.role
    FROM board_users bu
    JOIN boards b ON bu.board_id = b.id
    WHERE bu.user_id = ?
  `,
    )
    .all(userId);

  const allBoards = [...owned, ...collaborated];
  res.json(allBoards);
});

// POST /api/boards - creates board
app.post('/api/boards', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const ownerId = req.user.id;

  const stmt = db.prepare('INSERT INTO boards (title, description, owner_id) VALUES (?, ?, ?)');
  const info = stmt.run(name, description, ownerId);

  res.json({ id: info.lastInsertRowid, name, description });
});

// PUT /api/boards/:id - update name/desc
app.put('/api/boards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  // Check ownership or editor
  if (!isOwnerOrEditor(id, userId)) return res.sendStatus(403);

  const stmt = db.prepare('UPDATE boards SET title = ?, description = ? WHERE id = ?');
  stmt.run(name, description, id);

  res.json({ message: 'Updated' });
});

// DELETE /api/boards/:id
app.delete('/api/boards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isOwner(id, userId)) return res.sendStatus(403);

  const stmt = db.prepare('DELETE FROM boards WHERE id = ?');
  stmt.run(id);

  res.json({ message: 'Deleted' });
});

// GET /api/boards/:id/collaborators
app.get('/api/boards/:id/collaborators', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isOwnerOrEditor(id, userId)) return res.sendStatus(403);

  const collaborators = db
    .prepare(
      `
    SELECT u.id AS userId, u.username, bu.role
    FROM board_users bu
    JOIN users u ON bu.user_id = u.id
    WHERE bu.board_id = ?
  `,
    )
    .all(id);

  res.json(collaborators);
});

// PUT /api/boards/:id/collaborators - bulk update (for simplicity, replace all)
app.put('/api/boards/:id/collaborators', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { collaborators } = req.body; // array of {username, role}
  const userId = req.user.id;

  if (!isOwnerOrEditor(id, userId)) return res.sendStatus(403);

  try {
    db.transaction(() => {
      // clear existing
      db.prepare('DELETE FROM board_users WHERE board_id = ?').run(id);

      // add new
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO board_users (board_id, user_id, role) VALUES (?, ?, ?)',
      );
      for (const col of collaborators) {
        // extract role string safely
        const role = typeof col.role === 'string' ? col.role : col.role?.value || 'viewer';
        if (!['editor', 'viewer'].includes(role)) continue;

        const collabUser = db.prepare('SELECT id FROM users WHERE username = ?').get(col.username);
        // skip invalid username
        if (!collabUser) continue;

        stmt.run(id, collabUser.id, role);
      }
    })();

    res.json({ message: 'Collaborators updated' });
  } catch (err) {
    console.error('Collaborator update error:', err);
    res.status(500).json({ error: 'Failed to update collaborators' });
  }
});

// Helper functions
function isOwner(boardId, userId) {
  const board = db.prepare('SELECT owner_id FROM boards WHERE id = ?').get(boardId);
  return board && board.owner_id === userId;
}

function isOwnerOrEditor(boardId, userId) {
  if (isOwner(boardId, userId)) return true;
  const collab = db
    .prepare('SELECT role FROM board_users WHERE board_id = ? AND user_id = ?')
    .get(boardId, userId);
  return collab && collab.role === 'editor';
}
