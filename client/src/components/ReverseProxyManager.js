import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaPowerOff, FaCheck, FaTimes, FaSync, FaFlask, FaCopy } from 'react-icons/fa';
import api from '../services/api';
import './ReverseProxyManager.css';

function ReverseProxyManager() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [stats, setStats] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  // Get the backend server URL (not the React app URL)
  const getBackendUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    // Remove '/api' from the end to get the base URL
    return apiUrl.replace('/api', '');
  };

  const [formData, setFormData] = useState({
    path: '',
    target: '',
    type: 'api',
    proxy: '',
    description: '',
    enabled: true,
    headers: {}
  });

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  useEffect(() => {
    loadRoutes();
    loadStats();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reverse-proxy/routes');
      setRoutes(response.data.routes || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des routes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/reverse-proxy/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingRoute) {
        await api.put(`/reverse-proxy/routes/${editingRoute._id}`, formData);
      } else {
        await api.post('/reverse-proxy/routes', formData);
      }

      setShowForm(false);
      setEditingRoute(null);
      resetForm();
      loadRoutes();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette route ?')) {
      return;
    }

    try {
      await api.delete(`/reverse-proxy/routes/${id}`);
      loadRoutes();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await api.patch(`/reverse-proxy/routes/${id}/toggle`, { enabled: !enabled });
      loadRoutes();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      path: route.path,
      target: route.target,
      type: route.type,
      proxy: route.proxy || '',
      description: route.description || '',
      enabled: route.enabled,
      headers: route.headers || {}
    });
    setShowForm(true);
  };

  const handleTest = async () => {
    try {
      const response = await api.post('/reverse-proxy/test', {
        target: formData.target,
        proxy: formData.proxy || null,
        headers: formData.headers
      });
      setTestResult(response.data.test);
    } catch (err) {
      setTestResult({
        reachable: false,
        error: err.message
      });
    }
  };

  const resetForm = () => {
    setFormData({
      path: '',
      target: '',
      type: 'api',
      proxy: '',
      description: '',
      enabled: true,
      headers: {}
    });
    setHeaderKey('');
    setHeaderValue('');
    setTestResult(null);
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData({
        ...formData,
        headers: {
          ...formData.headers,
          [headerKey]: headerValue
        }
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({
      ...formData,
      headers: newHeaders
    });
  };

  const copyToClipboard = (text, routeId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUrl(routeId);
      setTimeout(() => setCopiedUrl(null), 2000);
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
  };

  if (loading) {
    return <div className="loading">Chargement des routes...</div>;
  }

  return (
    <div className="reverse-proxy-manager">
      <div className="manager-header">
        <h2>Reverse Proxy Manager</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <FaPlus /> Nouvelle Route
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Routes</div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-value">{stats.enabled}</div>
            <div className="stat-label">Actives</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{stats.disabled}</div>
            <div className="stat-label">Désactivées</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{stats.byType.api}</div>
            <div className="stat-label">API</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{stats.byType.stream}</div>
            <div className="stat-label">Stream</div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => {
          setShowForm(false);
          setEditingRoute(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoute ? 'Modifier la Route' : 'Nouvelle Route'}</h3>
              <button className="btn-close" onClick={() => {
                setShowForm(false);
                setEditingRoute(null);
                resetForm();
              }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Path *</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/api-auth"
                  required
                />
                <small>Doit commencer par /</small>
              </div>

              <div className="form-group">
                <label>Target URL *</label>
                <input
                  type="text"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="http://backend.example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="api">API (Axios)</option>
                    <option value="stream">Stream (http-proxy-middleware)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    Activée
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Proxy Server (optionnel)</label>
                <input
                  type="text"
                  value={formData.proxy}
                  onChange={(e) => setFormData({ ...formData, proxy: e.target.value })}
                  placeholder="http://10.34.78.16:3128"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la route..."
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Headers HTTP personnalisés</label>
                <div className="headers-section">
                  <div className="header-input-group">
                    <input
                      type="text"
                      placeholder="Header key"
                      value={headerKey}
                      onChange={(e) => setHeaderKey(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Header value"
                      value={headerValue}
                      onChange={(e) => setHeaderValue(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" onClick={addHeader}>
                      <FaPlus />
                    </button>
                  </div>

                  {Object.entries(formData.headers).length > 0 && (
                    <div className="headers-list">
                      {Object.entries(formData.headers).map(([key, value]) => (
                        <div key={key} className="header-item">
                          <span className="header-key">{key}:</span>
                          <span className="header-value">{value}</span>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeHeader(key)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleTest}>
                  <FaFlask /> Tester la connexion
                </button>

                {testResult && (
                  <div className={`test-result ${testResult.reachable ? 'success' : 'error'}`}>
                    {testResult.reachable ? (
                      <>
                        <FaCheck /> Connexion réussie (Status: {testResult.status})
                      </>
                    ) : (
                      <>
                        <FaTimes /> Échec: {testResult.error}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRoute(null);
                    resetForm();
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoute ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="routes-list">
        {routes.length === 0 ? (
          <div className="empty-state">
            <p>Aucune route configurée</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Créer votre première route
            </button>
          </div>
        ) : (
          routes.map((route) => (
            <div key={route._id} className={`route-card ${!route.enabled ? 'disabled' : ''}`}>
              <div className="route-header">
                <div className="route-path">
                  <span className={`badge badge-${route.type}`}>{route.type}</span>
                  <strong>{route.path}</strong>
                  {!route.enabled && <span className="badge badge-disabled">Désactivée</span>}
                </div>
                <div className="route-actions">
                  <button
                    className={`btn btn-sm ${route.enabled ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggle(route._id, route.enabled)}
                    title={route.enabled ? 'Désactiver' : 'Activer'}
                  >
                    <FaPowerOff />
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(route)}
                    title="Modifier"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(route._id)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="route-body">
                <div className="route-info">
                  <div className="info-item info-item-with-copy">
                    <label>Internal URL:</label>
                    <div className="url-container">
                      <span className="internal-url">
                        {getBackendUrl()}{route.path}
                      </span>
                      <button
                        className={`btn-copy ${copiedUrl === route._id ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(`${getBackendUrl()}${route.path}`, route._id)}
                        title={copiedUrl === route._id ? 'Copié !' : 'Copier l\'URL'}
                      >
                        {copiedUrl === route._id ? <FaCheck /> : <FaCopy />}
                      </button>
                    </div>
                  </div>

                  <div className="info-item">
                    <label>Backend Target:</label>
                    <span>{route.target}</span>
                  </div>

                  {route.proxy && (
                    <div className="info-item">
                      <label>Proxy Server:</label>
                      <span>{route.proxy}</span>
                    </div>
                  )}

                  {route.description && (
                    <div className="info-item">
                      <label>Description:</label>
                      <span>{route.description}</span>
                    </div>
                  )}

                  {Object.keys(route.headers || {}).length > 0 && (
                    <div className="info-item">
                      <label>Headers:</label>
                      <div className="headers-preview">
                        {Object.entries(route.headers).map(([key, value]) => (
                          <span key={key} className="header-tag">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="route-meta">
                  <small>Créée le: {new Date(route.createdAt).toLocaleString()}</small>
                  {route.updatedAt && route.updatedAt !== route.createdAt && (
                    <small>Modifiée le: {new Date(route.updatedAt).toLocaleString()}</small>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="manager-footer">
        <button className="btn btn-secondary" onClick={loadRoutes}>
          <FaSync /> Actualiser
        </button>
      </div>
    </div>
  );
}

export default ReverseProxyManager;
