import React, { useState, useEffect } from 'react';
import { tunnelAPI, sslServerAPI } from '../services/api';
import { FaPlus, FaStop, FaInfoCircle, FaTrash, FaFilter, FaPlay, FaChevronDown, FaChevronRight, FaSync, FaHeartbeat, FaEdit } from 'react-icons/fa';
import TunnelDetailsModal from './TunnelDetailsModal';
import './TunnelManager.css';
import { v4 as uuidv4 } from 'uuid';

function TunnelManager() {
  const [tunnels, setTunnels] = useState([]);
  const [savedTunnels, setSavedTunnels] = useState([]);
  const [sslServers, setSSLServers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState(null); // Track tunnel being edited
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTunnel, setSelectedTunnel] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'connected', 'disconnected', 'connecting', 'error'
  const [expandedTunnels, setExpandedTunnels] = useState({}); // Track which tunnels are expanded
  const logsEndRefs = React.useRef({}); // Refs for auto-scrolling logs

  const [formData, setFormData] = useState({
    name: '',
    sshHost: '',
    sshPort: '22',
    sshUser: '',
    sshPassword: '',
    sshKeyPath: '',
    localPort: '',
    remoteHost: '',
    remotePort: '',
    sslServerId: '',
    autoReconnect: false
  });
  const [currentTunnelId, setCurrentTunnelId] = useState(null); // Store tunnel ID for current form session

  useEffect(() => {
    fetchTunnels();
    fetchSavedTunnels();
    fetchSSLServers();
    const interval = setInterval(fetchTunnels, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSSLServers = async () => {
    try {
      const response = await sslServerAPI.getAll();
      setSSLServers(response.data.data);
    } catch (err) {
      console.error('Error fetching SSL servers:', err);
    }
  };

  const fetchTunnels = async () => {
    try {
      const response = await tunnelAPI.getAll();
      const tunnelsData = response.data.data;

      // Deduplicate tunnels by ID (just in case)
      const uniqueTunnels = tunnelsData.reduce((acc, tunnel) => {
        const existingIndex = acc.findIndex(t => t.id === tunnel.id);
        if (existingIndex === -1) {
          acc.push(tunnel);
        } else {
          // Keep the most recent one (with more logs or newer status)
          if ((tunnel.logs?.length || 0) >= (acc[existingIndex].logs?.length || 0)) {
            acc[existingIndex] = tunnel;
          }
        }
        return acc;
      }, []);

      setTunnels(uniqueTunnels);
    } catch (err) {
      console.error('Error fetching tunnels:', err);
    }
  };

  const fetchSavedTunnels = async () => {
    try {
      const response = await tunnelAPI.getSaved();
      setSavedTunnels(response.data.data);
    } catch (err) {
      console.error('Error fetching saved tunnels:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingTunnel) {
        // Update existing tunnel
        await tunnelAPI.update(editingTunnel.id, formData);
        setEditingTunnel(null);
        setCurrentTunnelId(null);
      } else {
        // Use existing ID or generate new one (only once per form session)
        const tunnelId = currentTunnelId || uuidv4();
        if (!currentTunnelId) {
          setCurrentTunnelId(tunnelId);
        }

        await tunnelAPI.create({
          ...formData,
          id: tunnelId
        });
      }

      // Only reset on success
      setShowForm(false);
      setCurrentTunnelId(null);
      setFormData({
        name: '',
        sshHost: '',
        sshPort: '22',
        sshUser: '',
        sshPassword: '',
        sshKeyPath: '',
        localPort: '',
        remoteHost: '',
        remotePort: ''
      });
      fetchTunnels();
      fetchSavedTunnels();
    } catch (err) {
      setError(err.response?.data?.error || (editingTunnel ? 'Failed to update tunnel' : 'Failed to create tunnel'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditTunnel = (tunnel) => {
    // Only allow editing disconnected or error tunnels
    if (tunnel.status === 'connected' || tunnel.status === 'connecting') {
      alert('Please stop the tunnel before editing');
      return;
    }

    // Find matching SSL server based on tunnel configuration
    const matchingServer = sslServers.find(server =>
      server.host === tunnel.config.sshHost &&
      server.port === tunnel.config.sshPort &&
      server.user === tunnel.config.sshUser
    );

    setEditingTunnel(tunnel);
    setFormData({
      name: tunnel.name,
      sshHost: tunnel.config.sshHost,
      sshPort: tunnel.config.sshPort,
      sshUser: tunnel.config.sshUser,
      sshPassword: tunnel.config.sshPassword || '',
      sshKeyPath: tunnel.config.sshKeyPath || '',
      localPort: tunnel.config.localPort,
      remoteHost: tunnel.config.remoteHost,
      remotePort: tunnel.config.remotePort,
      sslServerId: matchingServer ? matchingServer.id : '', // Auto-select matching server
      autoReconnect: tunnel.autoReconnect || false
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTunnel(null);
    setCurrentTunnelId(null); // Reset tunnel ID when canceling
    setFormData({
      name: '',
      sshHost: '',
      sshPort: '22',
      sshUser: '',
      sshPassword: '',
      sshKeyPath: '',
      localPort: '',
      remoteHost: '',
      remotePort: '',
      autoReconnect: false
    });
    setError(null);
  };

  const handleCloseTunnel = async (id) => {
    try {
      await tunnelAPI.close(id);
      fetchTunnels();
    } catch (err) {
      console.error('Error closing tunnel:', err);
    }
  };

  const handleStartTunnel = async (id) => {
    try {
      await tunnelAPI.start(id);
      fetchTunnels();
    } catch (err) {
      console.error('Error starting tunnel:', err);
      alert(err.response?.data?.error || 'Failed to start tunnel');
    }
  };

  const handleCheckStatus = async (id) => {
    try {
      const response = await tunnelAPI.checkStatus(id);
      console.log('Tunnel status:', response.data);
      fetchTunnels();
    } catch (err) {
      console.error('Error checking tunnel status:', err);
    }
  };

  const handleDeleteTunnel = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete tunnel "${name}"?`)) {
      try {
        await tunnelAPI.delete(id);
        fetchTunnels();
      } catch (err) {
        console.error('Error deleting tunnel:', err);
      }
    }
  };

  const getFilteredTunnels = () => {
    if (statusFilter === 'all') {
      return tunnels;
    }
    return tunnels.filter(tunnel => tunnel.status === statusFilter);
  };

  const handleDeleteSaved = async (id) => {
    if (window.confirm('Delete this saved tunnel configuration?')) {
      try {
        await tunnelAPI.deleteSaved(id);
        fetchSavedTunnels();
      } catch (err) {
        console.error('Error deleting saved tunnel:', err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSSLServerChange = async (e) => {
    const serverId = e.target.value;
    setFormData(prev => ({ ...prev, sslServerId: serverId }));

    if (serverId) {
      try {
        const response = await sslServerAPI.get(serverId);
        const server = response.data.data;
        setFormData(prev => ({
          ...prev,
          sshHost: server.host,
          sshPort: server.port,
          sshUser: server.user,
          sshKeyPath: server.sshKeyPath || '',
          sshPassword: '' // Don't auto-fill password for security
        }));
      } catch (err) {
        console.error('Error fetching server details:', err);
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'connected': return 'status-connected';
      case 'connecting': return 'status-connecting';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  };

  const toggleTunnelExpanded = (tunnelId) => {
    setExpandedTunnels(prev => ({
      ...prev,
      [tunnelId]: !prev[tunnelId]
    }));

    // Auto-scroll to bottom when expanding
    setTimeout(() => {
      const logsContainer = document.querySelector(`#logs-${tunnelId}`);
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }, 100);
  };

  // Auto-scroll logs when new logs arrive
  React.useEffect(() => {
    tunnels.forEach(tunnel => {
      if (expandedTunnels[tunnel.id]) {
        const logsContainer = document.querySelector(`#logs-${tunnel.id}`);
        if (logsContainer) {
          const isAtBottom = logsContainer.scrollHeight - logsContainer.scrollTop <= logsContainer.clientHeight + 50;
          if (isAtBottom) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
          }
        }
      }
    });
  }, [tunnels, expandedTunnels]);

  const filteredTunnels = getFilteredTunnels();

  return (
    <div className="tunnel-manager">
      <div className="manager-header">
        <h2>SSH Tunnels</h2>
        <div className="header-actions">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Tunnels ({tunnels.length})</option>
              <option value="connected">Connected ({tunnels.filter(t => t.status === 'connected').length})</option>
              <option value="connecting">Connecting ({tunnels.filter(t => t.status === 'connecting').length})</option>
              <option value="disconnected">Disconnected ({tunnels.filter(t => t.status === 'disconnected').length})</option>
              <option value="error">Error ({tunnels.filter(t => t.status === 'error').length})</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <FaPlus /> New Tunnel
          </button>
        </div>
      </div>

      {showForm && (
        <div className="tunnel-form-container">
          <form className="tunnel-form" onSubmit={handleSubmit}>
            <h3>{editingTunnel ? 'Edit SSH Tunnel' : 'Create New SSH Tunnel'}</h3>

            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Tunnel Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Tunnel"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h4>SSH Server Configuration</h4>

              {sslServers.length > 0 && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Use Saved SSL Server (Optional)</label>
                    <select
                      name="sslServerId"
                      value={formData.sslServerId}
                      onChange={handleSSLServerChange}
                      className="form-select"
                    >
                      <option value="">-- Manual Configuration --</option>
                      {sslServers.map(server => (
                        <option key={server.id} value={server.id}>
                          {server.name} ({server.user}@{server.host})
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">Select a saved server to auto-fill SSH configuration</small>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>SSH Host *</label>
                  <input
                    type="text"
                    name="sshHost"
                    value={formData.sshHost}
                    onChange={handleInputChange}
                    placeholder="xxx.xxx.xxx.xxx"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SSH Port</label>
                  <input
                    type="number"
                    name="sshPort"
                    value={formData.sshPort}
                    onChange={handleInputChange}
                    placeholder="22"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>SSH User *</label>
                  <input
                    type="text"
                    name="sshUser"
                    value={formData.sshUser}
                    onChange={handleInputChange}
                    placeholder="user"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>SSH Password</label>
                  <input
                    type="password"
                    name="sshPassword"
                    value={formData.sshPassword}
                    onChange={handleInputChange}
                    placeholder="Leave empty if using SSH key"
                  />
                </div>
                <div className="form-group">
                  <label>SSH Key Path</label>
                  <input
                    type="text"
                    name="sshKeyPath"
                    value={formData.sshKeyPath}
                    onChange={handleInputChange}
                    placeholder="~/.ssh/id_rsa"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Port Forwarding Configuration</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Local Port *</label>
                  <input
                    type="number"
                    name="localPort"
                    value={formData.localPort}
                    onChange={handleInputChange}
                    placeholder="8888"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Remote Host *</label>
                  <input
                    type="text"
                    name="remoteHost"
                    value={formData.remoteHost}
                    onChange={handleInputChange}
                    placeholder="dl.flathub.org"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Remote Port *</label>
                  <input
                    type="number"
                    name="remotePort"
                    value={formData.remotePort}
                    onChange={handleInputChange}
                    placeholder="443"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Advanced Options</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="autoReconnect"
                      checked={formData.autoReconnect}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoReconnect: e.target.checked }))}
                    />
                    <span>Enable Auto-Reconnect (max 100 attempts, 3s interval)</span>
                  </label>
                  <small className="form-hint">Automatically reconnect if tunnel disconnects (up to 5 minutes of retries)</small>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancelForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (editingTunnel ? 'Updating...' : 'Creating...') : (editingTunnel ? 'Update Tunnel' : 'Create Tunnel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedTunnel && (
        <TunnelDetailsModal
          tunnel={selectedTunnel}
          onClose={() => setSelectedTunnel(null)}
        />
      )}

      <div className="tunnels-grid">
        <div className="tunnels-section">
          <h3>
            {statusFilter === 'all' ? 'All Tunnels' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Tunnels`}
            <span className="tunnel-count">({filteredTunnels.length})</span>
          </h3>
          {filteredTunnels.length === 0 ? (
            <div className="empty-state">
              {statusFilter === 'all' ? 'No tunnels' : `No ${statusFilter} tunnels`}
            </div>
          ) : (
            <div className="tunnels-list">
              {filteredTunnels.map(tunnel => (
                <div key={tunnel.id} className="tunnel-card">
                  <div className="tunnel-header">
                    <h4>
                      {tunnel.name}
                      {tunnel.status === 'connected' && (
                        <span className="health-monitor-indicator" title="Auto health check active (5s)">
                          <FaHeartbeat />
                        </span>
                      )}
                    </h4>
                    <div className="status-container">
                      <span className={`status-badge ${getStatusClass(tunnel.status)}`}>
                        {tunnel.status}
                      </span>
                      {tunnel.autoReconnect && tunnel.reconnectAttempts > 0 && (
                        <span className="reconnect-badge">
                          Retry {tunnel.reconnectAttempts}/{tunnel.maxReconnectAttempts || 100}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="tunnel-details">
                    <div className="detail-row">
                      <span className="label">SSH:</span>
                      <span>{tunnel.config.sshUser}@{tunnel.config.sshHost}:{tunnel.config.sshPort}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Tunnel:</span>
                      <span>localhost:{tunnel.config.localPort} → {tunnel.config.remoteHost}:{tunnel.config.remotePort}</span>
                    </div>
                    {tunnel.error && (
                      <div className="error-text">{tunnel.error}</div>
                    )}

                    {/* Accordion for Logs */}
                    {tunnel.logs && tunnel.logs.length > 0 && (
                      <div className="logs-accordion">
                        <button
                          className="logs-accordion-header"
                          onClick={() => toggleTunnelExpanded(tunnel.id)}
                        >
                          {expandedTunnels[tunnel.id] ? <FaChevronDown /> : <FaChevronRight />}
                          <span>Logs ({tunnel.logs.length})</span>
                        </button>
                        {expandedTunnels[tunnel.id] && (
                          <div id={`logs-${tunnel.id}`} className="logs-accordion-content">
                            {tunnel.logs.map((log, idx) => (
                              <div key={idx} className={`mini-log-entry log-${log.type}`}>
                                <span className="log-time">{new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                <span className="log-msg">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="tunnel-actions">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleCheckStatus(tunnel.id)}
                      title="Check tunnel health"
                    >
                      <FaHeartbeat />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedTunnel(tunnel)}
                      title="View details"
                    >
                      <FaInfoCircle />
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleEditTunnel(tunnel)}
                      title="Edit tunnel configuration"
                      disabled={tunnel.status === 'connected' || tunnel.status === 'connecting'}
                    >
                      <FaEdit />
                    </button>
                    {tunnel.status === 'disconnected' || tunnel.status === 'error' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStartTunnel(tunnel.id)}
                        title="Start tunnel"
                      >
                        <FaPlay />
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCloseTunnel(tunnel.id)}
                        title="Stop tunnel"
                      >
                        <FaStop />
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTunnel(tunnel.id, tunnel.name)}
                      title="Delete tunnel permanently"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TunnelManager;
