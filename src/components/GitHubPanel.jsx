import React, { useState, useEffect } from 'react';

function GitHubPanel() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [commits, setCommits] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('commits');

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/repos');
      if (!response.ok) throw new Error('Failed to load repositories');
      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectRepo = async (repo) => {
    setSelectedRepo(repo);
    setActiveTab('commits');
    await Promise.all([
      loadBranches(repo),
      loadCommits(repo),
      loadPullRequests(repo)
    ]);
  };

  const loadBranches = async (repo) => {
    try {
      const response = await fetch(`/api/github/repo/${repo.owner.login}/${repo.name}/branches`);
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadCommits = async (repo) => {
    try {
      const response = await fetch(`/api/github/repo/${repo.owner.login}/${repo.name}/commits?per_page=10`);
      const data = await response.json();
      setCommits(data);
    } catch (err) {
      console.error('Failed to load commits:', err);
    }
  };

  const loadPullRequests = async (repo) => {
    try {
      const response = await fetch(`/api/github/repo/${repo.owner.login}/${repo.name}/pulls`);
      const data = await response.json();
      setPulls(data);
    } catch (err) {
      console.error('Failed to load PRs:', err);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">GitHub Repositories</h2>
          <button
            onClick={loadRepos}
            disabled={loading}
            className="px-4 py-2 bg-github hover:bg-gray-800 rounded-lg transition disabled:opacity-50 border border-gray-600"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Repos List */}
          <div className="space-y-3">
            {repos.slice(0, 15).map(repo => (
              <div
                key={repo.id}
                onClick={() => selectRepo(repo)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedRepo?.id === repo.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold truncate">{repo.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {repo.private ? '🔒 Private' : '🌍 Public'}
                    </p>
                  </div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:text-blue-400 ml-2"
                  >
                    ↗️
                  </a>
                </div>
                {repo.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span>⭐ {repo.stargazers_count}</span>
                  <span>🔀 {repo.forks_count}</span>
                </div>
              </div>
            ))}

            {repos.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔧</div>
                <p>No repositories found</p>
              </div>
            )}
          </div>

          {/* Selected Repo Details */}
          <div className="lg:col-span-2">
            {selectedRepo ? (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Repo Header */}
                <div className="p-6 border-b border-gray-700">
                  <h3 className="text-xl font-semibold mb-2">{selectedRepo.name}</h3>
                  {selectedRepo.description && (
                    <p className="text-gray-400 text-sm">{selectedRepo.description}</p>
                  )}
                  <div className="flex gap-4 mt-4 text-sm">
                    <span className="text-gray-400">
                      ⭐ {selectedRepo.stargazers_count} stars
                    </span>
                    <span className="text-gray-400">
                      🔀 {selectedRepo.forks_count} forks
                    </span>
                    <span className="text-gray-400">
                      {selectedRepo.language}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                  {['commits', 'branches', 'pulls'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 font-medium capitalize transition ${
                        activeTab === tab
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 max-h-96 overflow-auto">
                  {/* Commits Tab */}
                  {activeTab === 'commits' && (
                    <div className="space-y-3">
                      {commits.map(commit => (
                        <div key={commit.sha} className="p-3 bg-gray-900 rounded">
                          <div className="font-medium text-sm">
                            {commit.commit.message.split('\n')[0]}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{commit.commit.author.name}</span>
                            <span>•</span>
                            <span>{new Date(commit.commit.author.date).toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-xs font-mono text-gray-600">
                            {commit.sha.substring(0, 7)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Branches Tab */}
                  {activeTab === 'branches' && (
                    <div className="space-y-2">
                      {branches.map(branch => (
                        <div key={branch.name} className="p-3 bg-gray-900 rounded flex items-center justify-between">
                          <span className="font-medium">{branch.name}</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {branch.commit.sha.substring(0, 7)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pull Requests Tab */}
                  {activeTab === 'pulls' && (
                    <div className="space-y-3">
                      {pulls.length > 0 ? (
                        pulls.map(pr => (
                          <div key={pr.id} className="p-3 bg-gray-900 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{pr.title}</h4>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <span className={pr.state === 'open' ? 'text-green-400' : 'text-purple-400'}>
                                    ● {pr.state}
                                  </span>
                                  <span>#{pr.number}</span>
                                  <span>by {pr.user.login}</span>
                                </div>
                              </div>
                              <a
                                href={pr.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-blue-400 ml-2"
                              >
                                ↗️
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No open pull requests
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">👈</div>
                <p>Select a repository to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHubPanel;
