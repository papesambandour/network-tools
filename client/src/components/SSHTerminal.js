import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import io from 'socket.io-client';
import { sslServerAPI } from '../services/api';
import '@xterm/xterm/css/xterm.css';
import './SSHTerminal.css';
import { FaTerminal, FaTimes, FaPlus } from 'react-icons/fa';

function SSHTerminal() {
  const [servers, setServers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedServer, setSelectedServer] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const terminalsRef = useRef({});
  const socketsRef = useRef({});
  const fitAddonsRef = useRef({});

  useEffect(() => {
    fetchServers();
    return () => {
      // Cleanup all sessions on unmount
      Object.values(socketsRef.current).forEach(socket => {
        if (socket) socket.disconnect();
      });
    };
  }, []);

  const fetchServers = async () => {
    try {
      const response = await sslServerAPI.getAll();
      setServers(response.data.data);
    } catch (err) {
      console.error('Error fetching servers:', err);
    }
  };

  const createTerminal = (sessionId, container) => {
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      rows: 30,
      cols: 100,
      scrollback: 10000, // Keep 10000 lines in buffer
      convertEol: true // Convert \n to \r\n automatically
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(container);

    // Wait for terminal to be rendered before fitting
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn('Failed to fit terminal:', e);
      }
    }, 0);

    terminalsRef.current[sessionId] = terminal;
    fitAddonsRef.current[sessionId] = fitAddon;

    // Auto-scroll to bottom on new data (removed for now, handled per event)

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        // Emit resize event to SSH server
        const socket = socketsRef.current[sessionId];
        if (socket && socket.connected) {
          socket.emit('ssh:resize', {
            rows: terminal.rows,
            cols: terminal.cols
          });
        }
      } catch (e) {
        console.warn('Failed to resize terminal:', e);
      }
    });
    resizeObserver.observe(container);

    // Also handle global window resize
    const handleResize = () => {
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('Failed to fit terminal on window resize:', e);
        }
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    // Store cleanup function
    container._cleanup = () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };

    return terminal;
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!selectedServer) {
      setError('Please select a server');
      return;
    }

    setLoading(true);
    setError(null);

    const server = servers.find(s => s.id === selectedServer);
    if (!server) {
      setError('Server not found');
      setLoading(false);
      return;
    }

    const sessionId = `ssh-${Date.now()}`;
    const newSession = {
      id: sessionId,
      name: `${server.user}@${server.host}`,
      server: server,
      connected: false
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSession(sessionId);
    setShowConnectForm(false);
    setPassword('');
    setSelectedServer('');

    // Wait for terminal container to be rendered
    setTimeout(() => {
      const terminalContainer = document.getElementById(`terminal-${sessionId}`);
      if (!terminalContainer) {
        setError('Terminal container not found');
        setLoading(false);
        return;
      }

      const terminal = createTerminal(sessionId, terminalContainer);

      // Connect to backend via Socket.IO with dedicated namespace
      // Don't use REACT_APP_API_URL because it includes /api
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
      console.log('Connecting to Socket.IO at:', socketUrl + '/ssh-terminal');

      const socket = io(socketUrl + '/ssh-terminal', {
        query: {
          sessionId: sessionId
        },
        transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true,
        path: '/socket.io/'
      });

      socketsRef.current[sessionId] = socket;

      socket.on('connect', () => {
        console.log(`[Socket.IO] Connected for session: ${sessionId}`, socket.id);
        terminal.writeln('\x1b[32m✓ Connected to SSH service\x1b[0m');
        terminal.writeln('\x1b[33mInitiating SSH connection...\x1b[0m\r\n');

        // Send SSH connection request
        const sshConfig = {
          host: server.host,
          port: server.port,
          username: server.user,
          password: password || undefined,
          privateKeyPath: server.sshKeyPath || undefined
        };
        console.log('Sending SSH connection request:', { ...sshConfig, password: password ? '***' : undefined });
        socket.emit('ssh:connect', sshConfig);
      });

      socket.on('ssh:data', (data) => {
        console.log('Received SSH data:', data.substring(0, 50));
        terminal.write(data);
        // Auto-scroll to bottom when new data arrives
        terminal.scrollToBottom();
      });

      socket.on('ssh:ready', () => {
        console.log('SSH connection ready');
        terminal.writeln('\x1b[32m✓ SSH connection established\x1b[0m\r\n');
        setSessions(prev =>
          prev.map(s => s.id === sessionId ? { ...s, connected: true } : s)
        );
        setLoading(false);
      });

      socket.on('ssh:error', (error) => {
        terminal.writeln(`\r\n\x1b[31m✗ SSH Error: ${error}\x1b[0m\r\n`);
        setError(error);
        setLoading(false);
      });

      socket.on('ssh:close', () => {
        terminal.writeln('\r\n\x1b[33mSSH connection closed\x1b[0m');
        setSessions(prev =>
          prev.map(s => s.id === sessionId ? { ...s, connected: false } : s)
        );
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Disconnected for session: ${sessionId}`);
        terminal.writeln('\r\n\x1b[31m✗ Disconnected from SSH service\x1b[0m');
      });

      socket.on('connect_error', (error) => {
        console.error(`[Socket.IO] Connection error for session ${sessionId}:`, error);
        terminal.writeln(`\r\n\x1b[31m✗ Connection error: ${error.message}\x1b[0m\r\n`);
        setError(`Connection error: ${error.message}`);
        setLoading(false);
      });

      socket.on('connect_timeout', () => {
        console.error(`[Socket.IO] Connection timeout for session: ${sessionId}`);
        terminal.writeln('\r\n\x1b[31m✗ Connection timeout\x1b[0m\r\n');
        setError('Connection timeout');
        setLoading(false);
      });

      // Handle terminal input
      terminal.onData((data) => {
        if (socket.connected) {
          socket.emit('ssh:data', data);
        } else {
          console.warn('Socket not connected, cannot send data');
        }
      });

      // Handle terminal resize
      terminal.onResize(({ rows, cols }) => {
        socket.emit('ssh:resize', { rows, cols });
      });
    }, 100);
  };

  const closeSession = (sessionId) => {
    const socket = socketsRef.current[sessionId];
    if (socket) {
      socket.disconnect();
      delete socketsRef.current[sessionId];
    }

    const terminal = terminalsRef.current[sessionId];
    if (terminal) {
      terminal.dispose();
      delete terminalsRef.current[sessionId];
    }

    if (fitAddonsRef.current[sessionId]) {
      delete fitAddonsRef.current[sessionId];
    }

    // Cleanup container listeners
    const container = document.getElementById(`terminal-${sessionId}`);
    if (container && container._cleanup) {
      container._cleanup();
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId));

    if (activeSession === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSession(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  return (
    <div className="ssh-terminal-container">
      <div className="terminal-header">
        <h2><FaTerminal /> SSH Terminal</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowConnectForm(!showConnectForm)}
        >
          <FaPlus /> New Connection
        </button>
      </div>

      {showConnectForm && (
        <div className="connect-form-container">
          <form className="connect-form" onSubmit={handleConnect}>
            <h3>New SSH Connection</h3>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Select Server *</label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                required
              >
                <option value="">-- Select a server --</option>
                {servers.map(server => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.user}@{server.host}:{server.port})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Password (if not using SSH key)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty if using SSH key"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowConnectForm(false);
                  setError(null);
                  setPassword('');
                  setSelectedServer('');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </form>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty-terminal-state">
          <FaTerminal size={64} />
          <p>No active SSH sessions</p>
          <p className="hint">Click "New Connection" to start an SSH session</p>
        </div>
      ) : (
        <div className="terminal-workspace">
          <div className="terminal-tabs">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`terminal-tab ${activeSession === session.id ? 'active' : ''}`}
                onClick={() => setActiveSession(session.id)}
              >
                <span className={`status-dot ${session.connected ? 'connected' : 'disconnected'}`} />
                <span className="tab-name">{session.name}</span>
                <button
                  className="close-tab-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  title="Close session"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            <button
              className="new-tab-btn"
              onClick={() => setShowConnectForm(true)}
              title="New SSH connection"
            >
              <FaPlus />
            </button>
          </div>

          <div className="terminal-panels">
            {sessions.map(session => (
              <div
                key={session.id}
                id={`terminal-${session.id}`}
                className={`terminal-panel ${activeSession === session.id ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SSHTerminal;