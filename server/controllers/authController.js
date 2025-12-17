import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = 'your-secret-key-change-this-in-production';

export const register = async (username, password) => {
  if (!username || !password) {
    throw { status: 400, message: 'Missing fields' };
  }

  const hashed = await bcrypt.hash(password, 10);
  try {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed);
    return { message: 'User registered' };
  } catch (err) {
    console.error(err);
    throw { status: 400, message: 'Username already taken' };
  }
};

export const login = async (username, password) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  return { token, user: { id: user.id, username: user.username } };
};
