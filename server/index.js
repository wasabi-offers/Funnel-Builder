import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { spawn } from 'node-pty';
import figmaRoutes from './routes/figma.js';
import replitRoutes from './routes/replit.js';
import githubRoutes from './routes/github.js';
import commandRoutes from './routes/commands.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/figma', figmaRoutes);
app.use('/api/replit', replitRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/commands', commandRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// WebSocket for terminal
const wss = new WebSocketServer({ server, path: '/terminal' });

wss.on('connection', (ws) => {
  console.log('Terminal connected');

  // Create a pseudo-terminal
  const ptyProcess = spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
  });

  // Send terminal output to WebSocket
  ptyProcess.onData((data) => {
    ws.send(JSON.stringify({ type: 'output', data }));
  });

  // Handle incoming commands
  ws.on('message', (message) => {
    try {
      const { type, data } = JSON.parse(message);
      if (type === 'input') {
        ptyProcess.write(data);
      } else if (type === 'resize') {
        ptyProcess.resize(data.cols, data.rows);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Terminal disconnected');
    ptyProcess.kill();
  });
});

export default app;
