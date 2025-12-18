import jwt from 'jsonwebtoken';
import db from '../db.js';
import { createNote, updateNote, deleteNote, addComment } from '../controllers/noteController.js';

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

    // helpers functions to check presence
    async function getOnlineUsersInRoom(room) {
      const sockets = await io.in(room).fetchSockets();
      const usernames = new Set();
      for (const s of sockets) {
        if (s.user?.username) {
          usernames.add(s.user.username);
        }
      }
      return Array.from(usernames);
    }

    async function broadcastPresence(room) {
      const users = await getOnlineUsersInRoom(room);
      io.to(room).emit('presence:users', users);
    }

    // edit lock
    // noteId -> { userId, username, socketId }
    const editingLocks = new Map();

    function acquireEditLock(noteId, user) {
      const existing = editingLocks.get(noteId);
      if (existing && existing.userId !== user.id) {
        return { locked: true, editedBy: existing.username };
      }
      editingLocks.set(noteId, {
        userId: user.id,
        username: user.username,
        socketId: socket.id,
      });
      return { locked: false };
    }

    function releaseEditLock(noteId, userId) {
      const lock = editingLocks.get(noteId);
      if (lock && lock.userId === userId) {
        editingLocks.delete(noteId);
      }
    }

    // Join a board room
    socket.on('joinBoard', async (boardId) => {
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

      const room = `board:${boardId}`;
      socket.join(`board:${boardId}`);
      console.log(`${socket.user.username} joined board:${boardId}`);

      // send current notes immediately after joining
      const notes = db
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
          comments: note.comments ? JSON.parse(note.comments) : [],
        }));
      socket.emit('initialNotes', notes);
      await broadcastPresence(room);
    });

    // Leave board room
    socket.on('leaveBoard', async (boardId) => {
      const room = `board:${boardId}`;
      socket.leave(room);
      console.log(`${socket.user.username} left board:${boardId}`);

      await broadcastPresence(room);
    });

    // note events
    socket.on('note:create', (noteData) => {
      const boardId = noteData.boardId;
      if (!socket.rooms.has(`board:${boardId}`)) return;

      try {
        const newNote = createNote(boardId, socket.user.id, noteData);
        io.to(`board:${boardId}`).emit('note:created', newNote);
      } catch (err) {
        socket.emit('server:error', { message: err.message });
      }
    });

    socket.on('note:update', (noteData) => {
      const boardId = noteData.boardId;
      if (!socket.rooms.has(`board:${boardId}`)) return;

      try {
        const updatedNote = updateNote(noteData.id, boardId, socket.user.id, noteData);
        io.to(`board:${boardId}`).emit('note:updated', updatedNote);
      } catch (err) {
        socket.emit('server:error', { message: err.message });
      }
    });

    // EDIT LOCK EVENTS
    // edit start
    socket.on('note:edit:start', ({ noteId, boardId }) => {
      if (!socket.rooms.has(`board:${boardId}`)) return;

      const result = acquireEditLock(noteId, socket.user);

      if (result.locked) {
        // Tell the requester it's locked
        socket.emit('note:edit:locked', {
          noteId,
          editedBy: result.editedBy,
        });
      } else {
        // Broadcast to everyone in board (including sender)
        io.to(`board:${boardId}`).emit('note:edit:started', {
          noteId,
          editedBy: socket.user.username,
        });
      }
    });

    // edit ends (save or cancel)
    socket.on('note:edit:end', ({ noteId, boardId }) => {
      if (!socket.rooms.has(`board:${boardId}`)) return;

      releaseEditLock(noteId, socket.user.id);

      io.to(`board:${boardId}`).emit('note:edit:ended', { noteId });
    });

    socket.on('note:delete', ({ noteId, boardId }) => {
      if (!socket.rooms.has(`board:${boardId}`)) return;

      try {
        deleteNote(noteId, boardId, socket.user.id);
        io.to(`board:${boardId}`).emit('note:deleted', { noteId });
      } catch (err) {
        socket.emit('server:error', { message: err.message });
      }
    });

    socket.on('note:comment', ({ noteId, boardId, text }) => {
      if (!socket.rooms.has(`board:${boardId}`)) return;

      try {
        const result = addComment(noteId, boardId, socket.user.id, text);
        io.to(`board:${boardId}`).emit('note:commented', result);
      } catch (err) {
        socket.emit('server:error', { message: err.message });
      }
    });

    // when tab close, refresh, network loss
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);

      // release any edit locks this user held
      for (const [noteId, lock] of editingLocks.entries()) {
        if (lock.socketId === socket.id) {
          editingLocks.delete(noteId);
          // notify all clients in relevant boards
          for (const room of socket.rooms) {
            if (room.startsWith('board:')) {
              io.to(room).emit('note:edit:ended', { noteId });
            }
          }
        }
      }

      // update the presence for every board room this socket was in
      for (const room of socket.rooms) {
        if (room.startsWith('board')) {
          await broadcastPresence(room);
        }
      }
    });
  });
}
