import React, { useEffect, useRef, useState } from 'react';
import { FaTimes, FaServer, FaNetworkWired, FaClock, FaRedo, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { tunnelAPI } from '../services/api';
import './TunnelDetailsModal.css';

function TunnelDetailsModal({ tunnel: initialTunnel, onClose }) {
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);
  const [tunnel, setTunnel] = useState(initialTunnel);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false); // Start with false to enable auto-scroll

  // Fetch fresh tunnel data and health status
  useEffect(() => {
    const fetchTunnelDetails = async () => {
      try {
        const response = await tunnelAPI.get(tunnel.id);
        setTunnel(response.data.data);
      } catch (err) {
        console.error('Error fetching tunnel details:', err);
      }
    };

    const fetchHealthStatus = async () => {
      try {
        const response = await tunnelAPI.checkStatus(tunnel.id);
        setHealthStatus(response.data.data);
      } catch (err) {
        console.error('Error fetching health status:', err);
      }
    };

    // Fetch immediately
    fetchTunnelDetails();
    fetchHealthStatus();

    // Set up polling every 2 seconds for real-time updates
    const detailsInterval = setInterval(fetchTunnelDetails, 2000);
    const healthInterval = setInterval(fetchHealthStatus, 5000); // Health check every 5s

    return () => {
      clearInterval(detailsInterval);
      clearInterval(healthInterval);
    };
  }, [tunnel.id]);

  // Auto-scroll only if user is at the bottom
  useEffect(() => {
    if (!isUserScrolling && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tunnel.logs, isUserScrolling]);

  // Detect if user is scrolling
  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    setIsUserScrolling(!isAtBottom);
  };

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

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR');
  };

  const formatUptime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'connected': return 'status-connected';
      case 'connecting': return 'status-connecting';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FaServer /> {tunnel.name}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Section */}
          <div className="detail-section">
            <h3>Status</h3>
            <div className="status-info">
              <span className={`status-badge ${getStatusClass(tunnel.status)}`}>
                {tunnel.status}
              </span>
              {tunnel.autoReconnect && (
                <span className="auto-reconnect-badge">
                  <FaRedo /> Auto-Reconnect ON {tunnel.reconnectAttempts > 0 && `(${tunnel.reconnectAttempts}/${tunnel.maxReconnectAttempts || 100})`}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Health Monitor */}
          {tunnel.status === 'connected' && healthStatus && (
            <div className="detail-section health-section">
              <h3>Health Monitor <span className="live-indicator">●</span></h3>
              <div className="health-grid">
                <div className={`health-item ${healthStatus.sshConnectionAlive ? 'health-ok' : 'health-error'}`}>
                  {healthStatus.sshConnectionAlive ? <FaCheckCircle /> : <FaTimesCircle />}
                  <div className="health-info">
                    <span className="health-label">SSH Connection</span>
                    <span className="health-value">{healthStatus.sshConnectionAlive ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                <div className={`health-item ${healthStatus.localPortListening ? 'health-ok' : 'health-error'}`}>
                  {healthStatus.localPortListening ? <FaCheckCircle /> : <FaTimesCircle />}
                  <div className="health-info">
                    <span className="health-label">Local Port</span>
                    <span className="health-value">{healthStatus.localPortListening ? `Listening (${tunnel.config.localPort})` : 'Not Listening'}</span>
                  </div>
                </div>

                <div className={`health-item ${healthStatus.remoteEndpointReachable ? 'health-ok' : 'health-error'}`}>
                  {healthStatus.remoteEndpointReachable ? <FaCheckCircle /> : <FaTimesCircle />}
                  <div className="health-info">
                    <span className="health-label">Remote Endpoint</span>
                    <span className="health-value">
                      {healthStatus.remoteEndpointReachable
                        ? `Reachable (${tunnel.config.remoteHost}:${tunnel.config.remotePort})`
                        : `Unreachable (${tunnel.config.remoteHost}:${tunnel.config.remotePort})`}
                    </span>
                  </div>
                </div>

                {healthStatus.uptime > 0 && (
                  <div className="health-item health-info-only">
                    <FaClock />
                    <div className="health-info">
                      <span className="health-label">Uptime</span>
                      <span className="health-value">{formatUptime(healthStatus.uptime)}</span>
                    </div>
                  </div>
                )}
              </div>

              {healthStatus.healthWarning && (
                <div className="health-warning">
                  <FaExclamationTriangle /> {healthStatus.healthWarning}
                </div>
              )}
            </div>
          )}

          {/* Configuration Section */}
          <div className="detail-section">
            <h3><FaNetworkWired /> Configuration</h3>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">SSH Server:</span>
                <span className="config-value">{tunnel.config.sshUser}@{tunnel.config.sshHost}:{tunnel.config.sshPort}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Local Port:</span>
                <span className="config-value">{tunnel.config.localPort}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Remote Host:</span>
                <span className="config-value">{tunnel.config.remoteHost}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Remote Port:</span>
                <span className="config-value">{tunnel.config.remotePort}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Tunnel:</span>
                <span className="config-value">
                  localhost:{tunnel.config.localPort} → {tunnel.config.remoteHost}:{tunnel.config.remotePort}
                </span>
              </div>
            </div>
          </div>

          {/* Timing Section */}
          <div className="detail-section">
            <h3><FaClock /> Timing</h3>
            <div className="config-item">
              <span className="config-label">Created At:</span>
              <span className="config-value">{formatDate(tunnel.createdAt)}</span>
            </div>
          </div>

          {/* Error Section */}
          {tunnel.error && (
            <div className="detail-section">
              <h3>Error</h3>
              <div className="error-box">
                {tunnel.error}
              </div>
            </div>
          )}

          {/* Logs Section */}
          <div className="detail-section">
            <h3>Real-time Logs <span className="live-indicator">●</span></h3>
            <div className="modal-logs-container" ref={logsContainerRef} onScroll={handleScroll}>
              {tunnel.logs && tunnel.logs.length > 0 ? (
                tunnel.logs.map((log, index) => (
                  <div key={index} className={`modal-log-entry ${getLogClass(log.type)}`}>
                    <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                    <span className="log-type">[{log.type.toUpperCase()}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="no-logs">No logs available yet</div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TunnelDetailsModal;
