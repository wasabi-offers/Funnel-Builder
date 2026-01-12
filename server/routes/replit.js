import express from 'express';
import axios from 'axios';

const router = express.Router();
const REPLIT_GRAPHQL_URL = 'https://replit.com/graphql';

// Helper function to make GraphQL requests
async function replitGraphQL(query, variables = {}) {
  try {
    const response = await axios.post(
      REPLIT_GRAPHQL_URL,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': `connect.sid=${process.env.REPLIT_API_TOKEN}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.errors?.[0]?.message || error.message);
  }
}

// Get current user repls
router.get('/repls', async (req, res) => {
  try {
    const query = `
      query {
        currentUser {
          username
          repls(count: 20) {
            items {
              id
              title
              slug
              url
              language
              timeCreated
              timeUpdated
              isPrivate
            }
          }
        }
      }
    `;
    const data = await replitGraphQL(query);
    res.json(data);
  } catch (error) {
    console.error('Replit repls error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific repl info
router.get('/repl/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      query GetRepl($id: String!) {
        repl(id: $id) {
          id
          title
          slug
          url
          language
          description
          timeCreated
          timeUpdated
          isPrivate
          size
        }
      }
    `;
    const data = await replitGraphQL(query, { id });
    res.json(data);
  } catch (error) {
    console.error('Replit repl info error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get repl files
router.get('/repl/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      query GetReplFiles($id: String!) {
        repl(id: $id) {
          id
          files {
            path
            type
            size
          }
        }
      }
    `;
    const data = await replitGraphQL(query, { id });
    res.json(data);
  } catch (error) {
    console.error('Replit files error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
