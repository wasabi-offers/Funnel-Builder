import React, { useState } from 'react';

function FigmaPanel() {
  const [fileKey, setFileKey] = useState('');
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFile = async () => {
    if (!fileKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/figma/file/${fileKey}`);
      if (!response.ok) throw new Error('Failed to load Figma file');
      const data = await response.json();
      setFileData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Figma Files</h2>

        {/* File Input */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Enter Figma File Key (from URL)"
            value={fileKey}
            onChange={(e) => setFileKey(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
          />
          <button
            onClick={loadFile}
            disabled={loading || !fileKey}
            className="px-6 py-3 bg-figma hover:bg-red-600 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load File'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* File Data */}
        {fileData && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{fileData.name}</h3>
              <p className="text-gray-400 mb-4">
                Last Modified: {new Date(fileData.lastModified).toLocaleString()}
              </p>
              <div className="text-sm text-gray-500">
                Version: {fileData.version}
              </div>
            </div>

            {/* Pages */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-4">Pages</h4>
              <div className="space-y-2">
                {fileData.document?.children?.map((page, i) => (
                  <div key={i} className="p-3 bg-gray-900 rounded">
                    <div className="font-medium">{page.name}</div>
                    <div className="text-sm text-gray-400">
                      {page.children?.length || 0} frames
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Styles */}
            {fileData.styles && Object.keys(fileData.styles).length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="font-semibold mb-4">Styles</h4>
                <div className="text-gray-400">
                  {Object.keys(fileData.styles).length} style(s) found
                </div>
              </div>
            )}
          </div>
        )}

        {!fileData && !loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎨</div>
            <p>Enter a Figma file key to get started</p>
            <p className="text-sm mt-2">
              You can find the file key in the Figma URL:<br />
              figma.com/file/<strong>FILE_KEY</strong>/...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FigmaPanel;
