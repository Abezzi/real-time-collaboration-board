import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createNote, updateNote, deleteNote, addComment } from '../controllers/noteController.js';

// merge boardId from parent
const router = express.Router({ mergeParams: true });

router.post('/', authenticateToken, (req, res) => {
  try {
    const note = createNote(Number(req.params.id), req.user.id, req.body);
    res.json(note);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/:noteId', authenticateToken, (req, res) => {
  try {
    const note = updateNote(
      Number(req.params.noteId),
      Number(req.params.id),
      req.user.id,
      req.body,
    );
    res.json(note);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/:noteId', authenticateToken, (req, res) => {
  try {
    const result = deleteNote(Number(req.params.noteId), Number(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/:noteId/comments', authenticateToken, (req, res) => {
  try {
    const { text } = req.body;
    if (!text) throw { status: 400, message: 'Text required' };

    const result = addComment(Number(req.params.noteId), Number(req.params.id), req.user.id, text);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
