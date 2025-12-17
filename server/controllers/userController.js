import db from '../db.js';

export const checkUserExists = (username) => {
  if (!username) {
    return { exists: false };
  }

  // Case-insensitive check
  const user = db.prepare('SELECT 1 FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  return { exists: !!user };
};
