import db from '../db.js';
import { hasPageAccess, isOwner, isOwnerOrEditor } from '../utils/access.js';

export const listPages = (userId) => {
  const owned = db
    .prepare(
      `
    SELECT id, title AS name, description, 'owner' AS role
    FROM pages WHERE owner_id = ?
  `,
    )
    .all(userId);

  const collaborated = db
    .prepare(
      `
    SELECT b.id, b.title AS name, b.description, bu.role
    FROM page_users bu
    JOIN pages b ON bu.page_id = b.id
    WHERE bu.user_id = ?
  `,
    )
    .all(userId);

  return [...owned, ...collaborated];
};

export const getPage = (pageId, userId) => {
  if (!hasPageAccess(pageId, userId)) {
    throw { status: 403, message: 'Access denied' };
  }

  const page = db
    .prepare('SELECT id, title AS name, description, owner_id FROM pages WHERE id = ?')
    .get(pageId);

  if (!page) throw { status: 404, message: 'Page not found' };

  // Determine role
  let role = 'viewer';
  if (page.owner_id === userId) {
    role = 'owner';
  } else {
    const collab = db
      .prepare('SELECT role FROM page_users WHERE page_id = ? AND user_id = ?')
      .get(pageId, userId);
    if (collab) role = collab.role;
  }

  // remove owner_id from response
  delete page.owner_id;

  return {
    page,
    role,
  };
};

export const createPage = (name, description, ownerId) => {
  if (!name) throw { status: 400, message: 'Name is required' };

  const stmt = db.prepare('INSERT INTO pages (title, description, owner_id) VALUES (?, ?, ?)');
  const info = stmt.run(name, description || '', ownerId);

  return { id: info.lastInsertRowid, name, description: description || '' };
};

export const updatePage = (pageId, userId, { name, description }) => {
  if (!isOwnerOrEditor(pageId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  db.prepare('UPDATE pages SET title = ?, description = ? WHERE id = ?').run(
    name,
    description || '',
    pageId,
  );

  return { message: 'Page updated' };
};

export const deletePage = (pageId, userId) => {
  if (!isOwner(pageId, userId)) {
    throw { status: 403, message: 'Forbidden' };
  }

  db.prepare('DELETE FROM pages WHERE id = ?').run(pageId);
  return { message: 'Page deleted' };
};

export const getNotes = (pageId, userId) => {
  if (!hasPageAccess(pageId, userId)) {
    throw { status: 403, message: 'Access denied' };
  }

  return db
    .prepare(
      `
    SELECT id, title, content, x, y, z_index AS zIndex, color
    FROM notes WHERE page_id = ?
    ORDER BY z_index DESC
  `,
    )
    .all(pageId);
};
