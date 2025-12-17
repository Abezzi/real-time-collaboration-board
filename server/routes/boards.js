import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  getCollaborators,
  updateCollaborators,
  getNotes,
} from '../controllers/boardController.js';

const router = express.Router();

// List all boards for user
router.get('/', authenticateToken, (req, res) => {
  const boards = listBoards(req.user.id);
  res.json(boards);
});

// Get single board
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const board = getBoard(Number(req.params.id), req.user.id);
    res.json(board);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Create board
router.post('/', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const board = createBoard(name, description, req.user.id);
  res.status(201).json(board);
});

// Update board
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const result = updateBoard(Number(req.params.id), req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Delete board
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = deleteBoard(Number(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET Collaborators
router.get('/:id/collaborators', authenticateToken, (req, res) => {
  try {
    const collabs = getCollaborators(Number(req.params.id), req.user.id);
    res.json(collabs);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT Collaborators
router.put('/:id/collaborators', authenticateToken, (req, res) => {
  try {
    const result = updateCollaborators(Number(req.params.id), req.user.id, req.body.collaborators);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// FIXME: Notes (placeholder for now)
router.get('/:id/notes', authenticateToken, (req, res) => {
  const notes = getNotes(Number(req.params.id), req.user.id);
  res.json(notes);
});

export default router;
