import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
} from '../controllers/pageController.js';
import { getCollaborators, updateCollaborators } from '../controllers/collaboratorController.js';

const router = express.Router();

// List all pages for user
router.get('/', authenticateToken, (req, res) => {
  const pages = listPages(req.user.id);
  res.json(pages);
});

// Get single page
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const page = getPage(Number(req.params.id), req.user.id);
    res.json(page);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Create a page
router.post('/', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const page = createPage(name, description, req.user.id);
  res.status(201).json(page);
});

// Update page
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const result = updatePage(Number(req.params.id), req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Delete page
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = deletePage(Number(req.params.id), req.user.id);
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

export default router;
