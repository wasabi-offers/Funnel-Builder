import React, { useState, useEffect } from 'react';

function QuickCommands() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuickCommands();
  }, []);

  const fetchQuickCommands = async () => {
    try {
      const response = await fetch('/api/commands/quick');
      const data = await response.json();
      setCommands(data);
    } catch (error) {
      console.error('Failed to fetch quick commands:', error);
    }
  };

  const executeCommand = async (command) => {
    setLoading(true);
    try {
      const response = await fetch('/api/commands/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.command })
      });
      const result = await response.json();
      console.log('Command result:', result);
    } catch (error) {
      console.error('Command execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-3">
      <div className="flex gap-2 overflow-x-auto">
        {commands.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => executeCommand(cmd)}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm whitespace-nowrap transition disabled:opacity-50"
          >
            <span className="mr-2">{cmd.icon}</span>
            {cmd.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickCommands;
