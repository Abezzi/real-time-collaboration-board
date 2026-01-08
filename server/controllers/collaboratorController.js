import db from '../db.js';
import { isOwnerOrEditor } from '../utils/access.js';

export const getPageCollaborators = (pageId, userId) => {
  if (!isOwnerOrEditor(pageId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  const page = db.prepare('SELECT owner_id FROM pages WHERE id = ?').get(pageId);
  if (!page) throw { status: 404, message: 'Page not found' };

  const owner = db
    .prepare('SELECT id AS userId, username FROM users WHERE id = ?')
    .get(page.owner_id);

  const collaborators = db
    .prepare(
      `
    SELECT u.id AS userId, u.username, pu.role
    FROM page_users pu
    JOIN users u ON pu.user_id = u.id
    WHERE pu.page_id = ?
  `,
    )
    .all(pageId);

  // Prepend owner with role 'owner'
  const allCollaborators = [
    { userId: owner.userId, username: owner.username, role: 'owner' },
    ...collaborators,
  ];

  return allCollaborators;
};

export const updatePageCollaborators = (pageId, userId, collaborators = []) => {
  if (!isOwnerOrEditor(pageId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  db.transaction(() => {
    db.prepare('DELETE FROM page_users WHERE page_id = ?').run(pageId);
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO page_users (page_id, user_id, role) VALUES (?, ?, ?)',
    );
    for (const c of collaborators) {
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(c.username);
      if (user && ['editor', 'viewer'].includes(c.role)) {
        stmt.run(pageId, user.id, c.role);
      }
    }
  })();

  return { message: 'Collaborators updated' };
};

export const getBoardCollaborators = (boardId, userId) => {
  if (!isOwnerOrEditor(boardId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  const board = db.prepare('SELECT owner_id FROM boards WHERE id = ?').get(boardId);
  if (!board) throw { status: 404, message: 'Page not found' };

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

export const updateBoardCollaborators = (boardId, userId, collaborators = []) => {
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
