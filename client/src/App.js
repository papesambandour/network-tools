import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FaServer, FaCertificate, FaTerminal, FaDatabase, FaHome, FaTh, FaDesktop } from 'react-icons/fa';
import ModuleHome from './components/ModuleHome';
import TunnelManager from './components/TunnelManager';
import SSLManager from './components/SSLManager';
import SSLServerManager from './components/SSLServerManager';
import LogViewer from './components/LogViewer';
import SSHTerminal from './components/SSHTerminal';
import { connectWebSocket, disconnectWebSocket } from './services/websocket';
import './App.css';

function HomePage({ onModuleSelect, isConnected }) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CONTROL BOX</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'System Online' : 'System Offline'}</span>
        </div>
      </header>

      <div className="app-container">
        <ModuleHome onModuleSelect={onModuleSelect} />
      </div>
    </div>
  );
}

function SSHTunnelModule({ isConnected, logs, onClearLogs }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/tunnels')) return 'tunnels';
    if (path.includes('/terminal')) return 'terminal';
    if (path.includes('/servers')) return 'servers';
    if (path.includes('/ssl')) return 'ssl';
    if (path.includes('/logs')) return 'logs';
    return 'tunnels';
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="btn btn-secondary btn-sm home-button" onClick={handleBackToHome}>
            <FaHome /> Home
          </button>
          <h1>SSH Tunnel Manager</h1>
        </div>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <div className="app-container">
        <nav className="tabs">
          <button
            className={`tab ${getActiveTab() === 'tunnels' ? 'active' : ''}`}
            onClick={() => navigate('/ssh-tunnel/tunnels')}
          >
            <FaServer /> Tunnels SSH
          </button>
          <button
            className={`tab ${getActiveTab() === 'terminal' ? 'active' : ''}`}
            onClick={() => navigate('/ssh-tunnel/terminal')}
          >
            <FaDesktop /> SSH Terminal
          </button>
          <button
            className={`tab ${getActiveTab() === 'servers' ? 'active' : ''}`}
            onClick={() => navigate('/ssh-tunnel/servers')}
          >
            <FaDatabase /> SSL Servers
          </button>
          <button
            className={`tab ${getActiveTab() === 'ssl' ? 'active' : ''}`}
            onClick={() => navigate('/ssh-tunnel/ssl')}
          >
            <FaCertificate /> Certificats SSL
          </button>
          <button
            className={`tab ${getActiveTab() === 'logs' ? 'active' : ''}`}
            onClick={() => navigate('/ssh-tunnel/logs')}
          >
            <FaTerminal /> Logs
          </button>
          <button
            className="tab tab-home"
            onClick={handleBackToHome}
          >
            <FaTh /> Modules
          </button>
        </nav>

        <main className="app-content">
          <Routes>
            <Route path="/tunnels" element={<TunnelManager />} />
            <Route path="/terminal" element={<SSHTerminal />} />
            <Route path="/servers" element={<SSLServerManager />} />
            <Route path="/ssl" element={<SSLManager />} />
            <Route path="/logs" element={<LogViewer logs={logs} onClear={onClearLogs} />} />
            <Route path="/" element={<TunnelManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleLog = (log) => {
      setLogs(prevLogs => [...prevLogs, log].slice(-100)); // Keep last 100 logs
    };

    const handleStatus = (status) => {
      setIsConnected(status === 'connected');
    };

    connectWebSocket(handleLog, handleStatus);

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const handleModuleSelect = (moduleId) => {
    if (moduleId === 'ssh-tunnel') {
      navigate('/ssh-tunnel/tunnels');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage onModuleSelect={handleModuleSelect} isConnected={isConnected} />}
      />
      <Route
        path="/ssh-tunnel/*"
        element={<SSHTunnelModule isConnected={isConnected} logs={logs} onClearLogs={handleClearLogs} />}
      />
    </Routes>
  );
}

export default App;
