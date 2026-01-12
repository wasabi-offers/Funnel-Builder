import React from 'react';

function Sidebar({ activePanel, setActivePanel }) {
  const panels = [
    { id: 'figma', name: 'Figma', icon: '🎨', color: 'figma' },
    { id: 'replit', name: 'Replit', icon: '💻', color: 'replit' },
    { id: 'github', name: 'GitHub', icon: '🔧', color: 'github' }
  ];

  return (
    <div className="w-20 bg-[#0a0a0a] border-r border-gray-800 flex flex-col items-center py-6 gap-4">
      <div className="text-3xl mb-4">⚡</div>

      {panels.map(panel => (
        <button
          key={panel.id}
          onClick={() => setActivePanel(panel.id)}
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
            activePanel === panel.id
              ? 'bg-primary shadow-lg shadow-primary/50'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
          title={panel.name}
        >
          {panel.icon}
        </button>
      ))}

      <div className="flex-1" />

      <button
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gray-800 hover:bg-gray-700 transition"
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  );
}

export default Sidebar;
