import db from '../db.js';
import { isOwnerOrEditor } from '../utils/access.js';

export const getCollaborators = (pageId, userId) => {
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
    SELECT u.id AS userId, u.username, bu.role
    FROM page_users bu
    JOIN users u ON bu.user_id = u.id
    WHERE bu.page_id = ?
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

export const updateCollaborators = (pageId, userId, collaborators = []) => {
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
