import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FigmaPanel from './components/FigmaPanel';
import ReplitPanel from './components/ReplitPanel';
import GitHubPanel from './components/GitHubPanel';
import Terminal from './components/Terminal';
import QuickCommands from './components/QuickCommands';

function App() {
  const [activePanel, setActivePanel] = useState('figma');
  const [terminalVisible, setTerminalVisible] = useState(true);

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      {/* Sidebar */}
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {activePanel === 'figma' && '🎨 Figma Workspace'}
            {activePanel === 'replit' && '💻 Replit Workspace'}
            {activePanel === 'github' && '🔧 GitHub Workspace'}
          </h1>
          <button
            onClick={() => setTerminalVisible(!terminalVisible)}
            className="px-4 py-2 bg-primary rounded-lg hover:bg-blue-600 transition"
          >
            {terminalVisible ? '🔽 Hide Terminal' : '🔼 Show Terminal'}
          </button>
        </div>

        {/* Quick Commands */}
        <QuickCommands />

        {/* Panel Content */}
        <div className={`flex-1 overflow-hidden ${terminalVisible ? 'h-1/2' : 'h-full'}`}>
          {activePanel === 'figma' && <FigmaPanel />}
          {activePanel === 'replit' && <ReplitPanel />}
          {activePanel === 'github' && <GitHubPanel />}
        </div>

        {/* Terminal */}
        {terminalVisible && (
          <div className="h-1/2 border-t border-gray-800">
            <Terminal />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
