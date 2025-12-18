import db from '../db.js';
import { hasBoardAccess, isOwner, isOwnerOrEditor } from '../utils/access.js';

export const listBoards = (userId) => {
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

  return [...owned, ...collaborated];
};

export const getBoard = (boardId, userId) => {
  if (!hasBoardAccess(boardId, userId)) {
    throw { status: 403, message: 'Access denied' };
  }

  const board = db
    .prepare('SELECT id, title AS name, description, owner_id FROM boards WHERE id = ?')
    .get(boardId);

  if (!board) throw { status: 404, message: 'Board not found' };

  // Determine role
  let role = 'viewer';
  if (board.owner_id === userId) {
    role = 'owner';
  } else {
    const collab = db
      .prepare('SELECT role FROM board_users WHERE board_id = ? AND user_id = ?')
      .get(boardId, userId);
    if (collab) role = collab.role;
  }

  // remove owner_id from response
  delete board.owner_id;

  return {
    board,
    role,
  };
};

export const createBoard = (name, description, ownerId) => {
  if (!name) throw { status: 400, message: 'Name is required' };

  const stmt = db.prepare('INSERT INTO boards (title, description, owner_id) VALUES (?, ?, ?)');
  const info = stmt.run(name, description || '', ownerId);

  return { id: info.lastInsertRowid, name, description: description || '' };
};

export const updateBoard = (boardId, userId, { name, description }) => {
  if (!isOwnerOrEditor(boardId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  db.prepare('UPDATE boards SET title = ?, description = ? WHERE id = ?').run(
    name,
    description || '',
    boardId,
  );

  return { message: 'Board updated' };
};

export const deleteBoard = (boardId, userId) => {
  if (!isOwner(boardId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  db.prepare('DELETE FROM boards WHERE id = ?').run(boardId);
  return { message: 'Board deleted' };
};

export const getCollaborators = (boardId, userId) => {
  if (!isOwnerOrEditor(boardId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  const board = db.prepare('SELECT owner_id FROM boards WHERE id = ?').get(boardId);
  if (!board) throw { status: 404, message: 'Board not found' };

  const owner = db
    .prepare('SELECT id AS userId, username FROM users WHERE id = ?')
    .get(board.owner_id);

  const collaborators = db
    .prepare(
      `
    SELECT u.id AS userId, u.username, bu.role
    FROM board_users bu
    JOIN users u ON bu.user_id = u.id
    WHERE bu.board_id = ?
  `,
    )
    .all(boardId);

  // Prepend owner with role 'owner'
  const allCollaborators = [
    { userId: owner.userId, username: owner.username, role: 'owner' },
    ...collaborators,
  ];

  return allCollaborators;
};

export const updateCollaborators = (boardId, userId, collaborators = []) => {
  if (!isOwnerOrEditor(boardId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  db.transaction(() => {
    db.prepare('DELETE FROM board_users WHERE board_id = ?').run(boardId);
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO board_users (board_id, user_id, role) VALUES (?, ?, ?)',
    );
    for (const c of collaborators) {
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(c.username);
      if (user && ['editor', 'viewer'].includes(c.role)) {
        stmt.run(boardId, user.id, c.role);
      }
    }
  })();

  return { message: 'Collaborators updated' };
};

export const getNotes = (boardId, userId) => {
  if (!hasBoardAccess(boardId, userId)) {
    throw { status: 403, message: 'Access denied' };
  }

  return db
    .prepare(
      `
    SELECT id, title, content, x, y, z_index AS zIndex, color
    FROM notes WHERE board_id = ?
    ORDER BY z_index DESC
  `,
    )
    .all(boardId);
};
