import React, { useState, useEffect } from 'react';
import { sslServerAPI } from '../services/api';
import { FaServer, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './SSLServerManager.css';

function SSLServerManager() {
  const [servers, setServers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testingServer, setTestingServer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    user: '',
    password: '',
    sshKeyPath: '',
    description: ''
  });

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await sslServerAPI.getAll();
      setServers(response.data.data);
    } catch (err) {
      console.error('Error fetching servers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingServer) {
        await sslServerAPI.update(editingServer.id, formData);
      } else {
        await sslServerAPI.create(formData);
      }

      setShowForm(false);
      setEditingServer(null);
      resetForm();
      fetchServers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      host: server.host,
      port: server.port || '22',
      user: server.user,
      password: '', // Don't populate password for security
      sshKeyPath: server.sshKeyPath || '',
      description: server.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this SSL server configuration?')) {
      try {
        await sslServerAPI.delete(id);
        fetchServers();
      } catch (err) {
        console.error('Error deleting server:', err);
      }
    }
  };

  const handleTestConnection = async (id) => {
    setTestingServer(id);
    try {
      const response = await sslServerAPI.test(id);
      alert(response.data.message);
    } catch (err) {
      alert('Connection failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTestingServer(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '22',
      user: '',
      password: '',
      sshKeyPath: '',
      description: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingServer(null);
    resetForm();
    setError(null);
  };

  return (
    <div className="ssl-server-manager">
      <div className="manager-header">
        <h2>SSL Servers</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingServer(null);
            resetForm();
          }}
        >
          <FaPlus /> New Server
        </button>
      </div>

      {showForm && (
        <div className="server-form-container">
          <form className="server-form" onSubmit={handleSubmit}>
            <h3>{editingServer ? 'Edit' : 'Add New'} SSL Server</h3>

            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Server Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Production Server"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Host *</label>
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  placeholder="xxx.xxx.xxx.xxx or server.example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Port</label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  placeholder="22"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>User *</label>
                <input
                  type="text"
                  name="user"
                  value={formData.user}
                  onChange={handleInputChange}
                  placeholder="username"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Authentication</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingServer ? "Leave empty to keep current" : "Enter password"}
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

            <div className="form-row">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingServer ? 'Update Server' : 'Add Server'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="servers-list">
        {servers.length === 0 ? (
          <div className="empty-state">No SSL servers configured yet</div>
        ) : (
          servers.map(server => (
            <div key={server.id} className="server-card">
              <div className="server-icon">
                <FaServer size={32} />
              </div>
              <div className="server-details">
                <h4>{server.name}</h4>
                <div className="server-info">
                  <div className="info-row">
                    <span className="label">Host:</span>
                    <span className="value">{server.host}:{server.port}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">User:</span>
                    <span className="value">{server.user}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Auth:</span>
                    <span className="value">
                      {server.sshKeyPath ? 'SSH Key' : 'Password'}
                    </span>
                  </div>
                  {server.description && (
                    <div className="info-row">
                      <span className="label">Description:</span>
                      <span className="value">{server.description}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="server-actions">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleTestConnection(server.id)}
                  disabled={testingServer === server.id}
                  title="Test Connection"
                >
                  {testingServer === server.id ? 'Testing...' : <FaCheckCircle />}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(server)}
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(server.id)}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SSLServerManager;
