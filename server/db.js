import Database from 'better-sqlite3';

const db = new Database('app.db', { verbose: console.log });

// safely add columns if they don't exist
function addColumnIfNotExists(table, column, definition) {
  const pragma = db.pragma(`table_info(${table})`);
  const exists = pragma.some((col) => col.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${column} to table ${table}`);
  }
}

// init DB tables
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

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Note',
    content TEXT DEFAULT '',
    x REAL NOT NULL DEFAULT 100,
    y REAL NOT NULL DEFAULT 100,
    z_index INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#fff59d',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );
`);

// migrate existing boards table if needed
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

export default db;
