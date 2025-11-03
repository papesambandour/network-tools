import React, { useEffect, useRef } from 'react';
import { FaTrash, FaTerminal } from 'react-icons/fa';
import './LogViewer.css';

function LogViewer({ logs, onClear }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogClass = (type) => {
    switch (type) {
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      case 'success': return 'log-success';
      default: return 'log-info';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="log-viewer">
      <div className="log-header">
        <h2><FaTerminal /> Real-time Logs</h2>
        <button className="btn btn-secondary" onClick={onClear}>
          <FaTrash /> Clear Logs
        </button>
      </div>

      <div className="log-container">
        {logs.length === 0 ? (
          <div className="empty-logs">No logs yet. Logs will appear here when you create tunnels.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${getLogClass(log.type)}`}>
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span className="log-type">[{log.type.toUpperCase()}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

export default LogViewer;
