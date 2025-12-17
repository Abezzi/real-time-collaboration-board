import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import { setupSocket } from './socket/index.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:9000',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(cors({ origin: 'http://localhost:9000' }));

// Routes
app.use('/api', authRoutes);
app.use('/api/boards', boardRoutes);

// Setup socket.io
setupSocket(io);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
