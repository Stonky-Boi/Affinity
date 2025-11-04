import express = require('express');
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handleSocketEvents } from './socket/handler';
import apiRouter from './api'; // Import the main API router

import cors from 'cors';
require('dotenv').config();

// --- Initialization ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
  }
});
const port: number = 3000;

// --- Global Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// All your API routes are now prefixed with /api
app.use('/api', apiRouter);

// --- Socket.io Event Handling ---
handleSocketEvents(io);

// --- Server Start ---
httpServer.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});

export { };