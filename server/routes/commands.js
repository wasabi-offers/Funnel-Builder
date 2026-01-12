import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Execute a command
router.post('/exec', async (req, res) => {
  try {
    const { command, cwd = process.cwd() } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Security: whitelist common commands
    const allowedCommands = [
      'git', 'npm', 'yarn', 'node', 'ls', 'pwd', 'cat',
      'echo', 'mkdir', 'rm', 'cp', 'mv', 'touch'
    ];

    const commandStart = command.trim().split(' ')[0];
    if (!allowedCommands.some(cmd => commandStart.startsWith(cmd))) {
      return res.status(403).json({
        error: 'Command not allowed',
        allowedCommands
      });
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 30000, // 30 seconds max
      maxBuffer: 1024 * 1024 // 1MB max output
    });

    res.json({
      success: true,
      stdout,
      stderr,
      command
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      command: req.body.command
    });
  }
});

// Quick commands
router.get('/quick', (req, res) => {
  const quickCommands = [
    {
      id: 'git-status',
      name: 'Git Status',
      command: 'git status',
      icon: '📊',
      category: 'git'
    },
    {
      id: 'git-pull',
      name: 'Git Pull',
      command: 'git pull',
      icon: '⬇️',
      category: 'git'
    },
    {
      id: 'git-push',
      name: 'Git Push',
      command: 'git push',
      icon: '⬆️',
      category: 'git'
    },
    {
      id: 'npm-install',
      name: 'NPM Install',
      command: 'npm install',
      icon: '📦',
      category: 'npm'
    },
    {
      id: 'npm-dev',
      name: 'NPM Dev',
      command: 'npm run dev',
      icon: '🚀',
      category: 'npm'
    },
    {
      id: 'npm-build',
      name: 'NPM Build',
      command: 'npm run build',
      icon: '🔨',
      category: 'npm'
    },
    {
      id: 'npm-test',
      name: 'NPM Test',
      command: 'npm test',
      icon: '🧪',
      category: 'npm'
    }
  ];

  res.json(quickCommands);
});

export default router;
