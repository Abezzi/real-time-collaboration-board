import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const result = await register(req.body.username, req.body.password);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body.username, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
