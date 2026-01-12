import express from 'express';
import axios from 'axios';

const router = express.Router();
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Get file data
router.get('/file/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Figma API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Get file images
router.get('/images/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { ids, scale = 1, format = 'png' } = req.query;

    const response = await axios.get(`${FIGMA_API_BASE}/images/${fileKey}`, {
      params: { ids, scale, format },
      headers: {
        'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Figma images error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Get team projects
router.get('/teams/:teamId/projects', async (req, res) => {
  try {
    const { teamId } = req.params;
    const response = await axios.get(`${FIGMA_API_BASE}/teams/${teamId}/projects`, {
      headers: {
        'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Figma projects error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Get project files
router.get('/projects/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const response = await axios.get(`${FIGMA_API_BASE}/projects/${projectId}/files`, {
      headers: {
        'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Figma files error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Get file comments
router.get('/file/:fileKey/comments', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/comments`, {
      headers: {
        'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Figma comments error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

export default router;
