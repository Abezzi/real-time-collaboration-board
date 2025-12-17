import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = 'your-secret-key-change-this-in-production';

export function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Invalid token'));
      // { id, username }
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (socket.id: ${socket.id})`);

    // Join a board room when client sends 'joinBoard'
    socket.on('joinBoard', (boardId) => {
      // Basic access check (same as HTTP routes)
      const userId = socket.user.id;
      const hasAccess =
        db.prepare('SELECT 1 FROM boards WHERE id = ? AND owner_id = ?').get(boardId, userId) ||
        db
          .prepare('SELECT 1 FROM board_users WHERE board_id = ? AND user_id = ?')
          .get(boardId, userId);

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this board' });
        return;
      }

      socket.join(`board:${boardId}`);
      console.log(`${socket.user.username} joined board:${boardId}`);

      // optional: send current notes immediately after joining
      const notes = db
        .prepare(
          `
        SELECT id, title, content, x, y, z_index AS zIndex, color
        FROM notes WHERE board_id = ?
        ORDER BY z_index DESC
      `,
        )
        .all(boardId);
      socket.emit('initialNotes', notes);
    });

    // Leave board room
    socket.on('leaveBoard', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`${socket.user.username} left board:${boardId}`);
    });

    // Real-time note events
    socket.on('createNote', (note) => {
      const room = `board:${note.boardId}`;
      if (!socket.rooms.has(room)) return; // security

      // Insert into DB
      const stmt = db.prepare(`
        INSERT INTO notes (board_id, title, content, x, y, z_index, color)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        note.boardId,
        note.title || 'New Note',
        note.content || '',
        note.x || 100,
        note.y || 100,
        note.zIndex || 0,
        note.color || '#fff59d',
      );

      const newNote = {
        id: info.lastInsertRowid,
        ...note,
      };

      // Broadcast to everyone in the room (including sender)
      io.to(room).emit('noteCreated', newNote);
    });

    socket.on('updateNote', (note) => {
      const room = `board:${note.boardId}`;
      if (!socket.rooms.has(room)) return;

      db.prepare(
        `
        UPDATE notes
        SET title = ?, content = ?, x = ?, y = ?, z_index = ?, color = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND board_id = ?
      `,
      ).run(
        note.title,
        note.content,
        note.x,
        note.y,
        note.zIndex,
        note.color,
        note.id,
        note.boardId,
      );

      io.to(room).emit('noteUpdated', note);
    });

    socket.on('deleteNote', ({ noteId, boardId }) => {
      const room = `board:${boardId}`;
      if (!socket.rooms.has(room)) return;

      db.prepare('DELETE FROM notes WHERE id = ? AND board_id = ?').run(noteId, boardId);
      io.to(room).emit('noteDeleted', { noteId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
}
