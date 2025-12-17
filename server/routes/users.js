import express from 'express';
import { checkUserExists } from '../controllers/userController.js';

const router = express.Router();

// Public endpoint - no authentication needed (only checks existence)
router.get('/exists', (req, res) => {
  const { username } = req.query;
  const result = checkUserExists(username);
  res.json(result);
});

export default router;
