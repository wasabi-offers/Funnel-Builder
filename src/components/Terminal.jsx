import React, { useEffect, useRef, useState } from 'react';

function Terminal() {
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket terminal
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:3001/terminal`);

    ws.onopen = () => {
      setConnected(true);
      addOutput('Terminal connected. Type your commands below.\n', 'system');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'output') {
          addOutput(message.data, 'output');
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addOutput('Connection error. Terminal may not work properly.\n', 'error');
    };

    ws.onclose = () => {
      setConnected(false);
      addOutput('Terminal disconnected.\n', 'error');
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const addOutput = (text, type = 'output') => {
    setOutput(prev => [...prev, { text, type, timestamp: Date.now() }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current || !connected) return;

    addOutput(`$ ${input}\n`, 'input');

    wsRef.current.send(JSON.stringify({
      type: 'input',
      data: input + '\n'
    }));

    setInput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">💻</span>
          <span className="font-semibold">Terminal</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <button
          onClick={() => setOutput([])}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Clear
        </button>
      </div>

      {/* Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {output.map((item, i) => (
          <div
            key={i}
            className={
              item.type === 'input'
                ? 'text-green-400'
                : item.type === 'error'
                ? 'text-red-400'
                : item.type === 'system'
                ? 'text-blue-400'
                : 'text-gray-300'
            }
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command..."
            disabled={!connected}
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm disabled:opacity-50"
          />
        </div>
      </form>
    </div>
  );
}

export default Terminal;
