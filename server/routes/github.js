import express from 'express';
import { Octokit } from 'octokit';

const router = express.Router();

// Initialize Octokit
function getOctokit() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN
  });
}

// Get user repos
router.get('/repos', async (req, res) => {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 30
    });
    res.json(data);
  } catch (error) {
    console.error('GitHub repos error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get repo details
router.get('/repo/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.get({ owner, repo });
    res.json(data);
  } catch (error) {
    console.error('GitHub repo error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get branches
router.get('/repo/:owner/:repo/branches', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.listBranches({ owner, repo });
    res.json(data);
  } catch (error) {
    console.error('GitHub branches error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get commits
router.get('/repo/:owner/:repo/commits', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { sha, per_page = 10 } = req.query;
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha,
      per_page: parseInt(per_page)
    });
    res.json(data);
  } catch (error) {
    console.error('GitHub commits error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get pull requests
router.get('/repo/:owner/:repo/pulls', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'open' } = req.query;
    const octokit = getOctokit();
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state
    });
    res.json(data);
  } catch (error) {
    console.error('GitHub PRs error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get issues
router.get('/repo/:owner/:repo/issues', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'open' } = req.query;
    const octokit = getOctokit();
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state
    });
    res.json(data);
  } catch (error) {
    console.error('GitHub issues error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Get file content
router.get('/repo/:owner/:repo/contents/*', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const path = req.params[0];
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });
    res.json(data);
  } catch (error) {
    console.error('GitHub content error:', error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
