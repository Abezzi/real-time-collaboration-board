import db from '../db.js';
import { hasBoardAccess, isOwnerOrEditor } from '../utils/access.js';

export const getNotes = (boardId, userId) => {
  if (!hasBoardAccess(boardId, userId)) {
    throw { status: 403, message: 'Access denied' };
  }

  return db
    .prepare(
      `
        SELECT
          n.id,
          n.title,
          n.content,
          n.x,
          n.y,
          n.z_index AS zIndex,
          n.color,
          n.comments,
          u.username AS updatedByUsername
        FROM notes n
        LEFT JOIN users u ON n.updated_by = u.id
        WHERE n.board_id = ?
        ORDER BY n.z_index DESC
      `,
    )
    .all(boardId)
    .map((note) => ({
      ...note,
      comments: JSON.parse(note.comments || '[]'),
    }));
};

export const createNote = (boardId, userId, noteData) => {
  if (!isOwnerOrEditor(boardId, userId)) throw { status: 403, message: 'Forbidden' };
  const {
    title = 'New Note',
    content = '',
    x = 100,
    y = 100,
    zIndex = 0,
    color = '#fff59d',
  } = noteData;

  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
  const stmt = db.prepare(`
    INSERT INTO notes (board_id, title, content, x, y, z_index, color, updated_by, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]')
  `);
  const info = stmt.run(boardId, title, content, x, y, zIndex, color, userId);
  return {
    id: info.lastInsertRowid,
    title,
    content,
    x,
    y,
    zIndex,
    color,
    updatedBy: userId,
    updatedByUsername: user.username,
    comments: [],
  };
};

export const updateNote = (noteId, boardId, userId, updates) => {
  if (!isOwnerOrEditor(boardId, userId)) throw { status: 403, message: 'Forbidden' };

  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND board_id = ?').get(noteId, boardId);
  if (!note) throw { status: 404, message: 'Note not found' };

  const {
    title = note.title,
    content = note.content,
    x = note.x,
    y = note.y,
    zIndex = note.z_index,
    color = note.color,
  } = updates;

  db.prepare(
    `
    UPDATE notes SET title = ?, content = ?, x = ?, y = ?, z_index = ?, color = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  ).run(title, content, x, y, zIndex, color, userId, noteId);

  return {
    id: noteId,
    title,
    content,
    x,
    y,
    zIndex,
    color,
    updatedBy: userId,
    comments: JSON.parse(note.comments || '[]'),
  };
};

export const deleteNote = (noteId, boardId, userId) => {
  if (!isOwnerOrEditor(boardId, userId)) throw { status: 403, message: 'Forbidden' };

  db.prepare('DELETE FROM notes WHERE id = ? AND board_id = ?').run(noteId, boardId);
  return { noteId, boardId };
};

export const addComment = (noteId, boardId, userId, text) => {
  if (!hasBoardAccess(boardId, userId)) throw { status: 403, message: 'Access denied' };

  const note = db
    .prepare('SELECT comments FROM notes WHERE id = ? AND board_id = ?')
    .get(noteId, boardId);
  if (!note) throw { status: 404, message: 'Note not found' };

  const comments = JSON.parse(note.comments || '[]');
  const newComment = {
    id: `c${comments.length + 1}`,
    user:
      db.prepare('SELECT username FROM users WHERE id = ?').get(userId)?.username || 'Anonymous',
    text,
    timestamp: Math.floor(Date.now() / 1000),
  };

  comments.push(newComment);
  db.prepare(
    'UPDATE notes SET comments = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(JSON.stringify(comments), userId, noteId);

  return { noteId, newComment };
};
