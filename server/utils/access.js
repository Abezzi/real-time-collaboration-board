import db from '../db.js';

export function isOwner(boardId, userId) {
  const board = db.prepare('SELECT owner_id FROM boards WHERE id = ?').get(boardId);
  return board && board.owner_id === userId;
}

export function isOwnerOrEditor(boardId, userId) {
  if (isOwner(boardId, userId)) return true;
  const collab = db
    .prepare('SELECT role FROM board_users WHERE board_id = ? AND user_id = ?')
    .get(boardId, userId);
  return collab && collab.role === 'editor';
}

export function hasBoardAccess(boardId, userId) {
  return (
    isOwner(boardId, userId) ||
    db
      .prepare('SELECT 1 FROM board_users WHERE board_id = ? AND user_id = ?')
      .get(boardId, userId) !== undefined
  );
}
