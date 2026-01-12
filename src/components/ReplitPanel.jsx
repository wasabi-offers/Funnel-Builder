import React, { useState, useEffect } from 'react';

function ReplitPanel() {
  const [repls, setRepls] = useState([]);
  const [selectedRepl, setSelectedRepl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRepls();
  }, []);

  const loadRepls = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/replit/repls');
      if (!response.ok) throw new Error('Failed to load Repls');
      const data = await response.json();
      setRepls(data.data?.currentUser?.repls?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectRepl = async (repl) => {
    setSelectedRepl(repl);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Repls</h2>
          <button
            onClick={loadRepls}
            disabled={loading}
            className="px-4 py-2 bg-replit hover:bg-orange-600 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repls List */}
          <div className="space-y-3">
            {repls.map(repl => (
              <div
                key={repl.id}
                onClick={() => selectRepl(repl)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedRepl?.id === repl.id
                    ? 'bg-replit/20 border-2 border-replit'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{repl.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {repl.language} • {repl.isPrivate ? '🔒 Private' : '🌍 Public'}
                    </p>
                  </div>
                  <a
                    href={repl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:text-blue-400"
                  >
                    ↗️
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Updated: {new Date(repl.timeUpdated).toLocaleString()}
                </p>
              </div>
            ))}

            {repls.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">💻</div>
                <p>No Repls found</p>
              </div>
            )}
          </div>

          {/* Selected Repl Details */}
          <div>
            {selectedRepl ? (
              <div className="bg-gray-800 rounded-lg p-6 sticky top-6">
                <h3 className="text-xl font-semibold mb-4">{selectedRepl.title}</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Language:</span>
                    <span className="ml-2 font-medium">{selectedRepl.language}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Slug:</span>
                    <span className="ml-2 font-mono text-xs">{selectedRepl.slug}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2">
                      {new Date(selectedRepl.timeCreated).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Updated:</span>
                    <span className="ml-2">
                      {new Date(selectedRepl.timeUpdated).toLocaleString()}
                    </span>
                  </div>
                </div>

                <a
                  href={selectedRepl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block w-full px-4 py-3 bg-replit hover:bg-orange-600 rounded-lg text-center font-medium transition"
                >
                  Open in Replit ↗️
                </a>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">👈</div>
                <p>Select a Repl to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReplitPanel;
