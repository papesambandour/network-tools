import React, { useState, useEffect } from 'react';
import { sslAPI } from '../services/api';
import { FaPlus, FaCertificate, FaDownload, FaTrash, FaKey } from 'react-icons/fa';
import './SSLManager.css';

function SSLManager() {
  const [certificates, setCertificates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    commonName: '',
    countryName: 'US',
    stateName: '',
    localityName: '',
    organizationName: '',
    validityDays: 365
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await sslAPI.getAll();
      setCertificates(response.data.data);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sslAPI.generate(formData);
      setShowForm(false);
      setFormData({
        commonName: '',
        countryName: 'US',
        stateName: '',
        localityName: '',
        organizationName: '',
        validityDays: 365
      });
      fetchCertificates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileName, type = 'cert') => {
    try {
      const response = type === 'cert'
        ? await sslAPI.download(fileName)
        : await sslAPI.downloadKey(fileName);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'cert' ? fileName : fileName.replace('cert_', 'key_'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const handleDelete = async (fileName) => {
    if (window.confirm('Delete this certificate?')) {
      try {
        await sslAPI.delete(fileName);
        fetchCertificates();
      } catch (err) {
        console.error('Error deleting certificate:', err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="ssl-manager">
      <div className="manager-header">
        <h2>SSL Certificates</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FaPlus /> Generate Certificate
        </button>
      </div>

      {showForm && (
        <div className="ssl-form-container">
          <form className="ssl-form" onSubmit={handleSubmit}>
            <h3>Generate SSL Certificate</h3>

            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Common Name (Domain) *</label>
                <input
                  type="text"
                  name="commonName"
                  value={formData.commonName}
                  onChange={handleInputChange}
                  placeholder="localhost or example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country Code</label>
                <input
                  type="text"
                  name="countryName"
                  value={formData.countryName}
                  onChange={handleInputChange}
                  placeholder="US"
                  maxLength="2"
                />
              </div>
              <div className="form-group">
                <label>State/Province</label>
                <input
                  type="text"
                  name="stateName"
                  value={formData.stateName}
                  onChange={handleInputChange}
                  placeholder="California"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City/Locality</label>
                <input
                  type="text"
                  name="localityName"
                  value={formData.localityName}
                  onChange={handleInputChange}
                  placeholder="San Francisco"
                />
              </div>
              <div className="form-group">
                <label>Organization</label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="My Company"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Validity (Days)</label>
                <input
                  type="number"
                  name="validityDays"
                  value={formData.validityDays}
                  onChange={handleInputChange}
                  placeholder="365"
                  min="1"
                  max="3650"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="certificates-list">
        {certificates.length === 0 ? (
          <div className="empty-state">No certificates generated yet</div>
        ) : (
          certificates.map(cert => (
            <div key={cert.fileName} className={`certificate-card ${cert.isExpired ? 'expired' : ''}`}>
              <div className="cert-icon">
                <FaCertificate size={40} />
              </div>
              <div className="cert-details">
                <h4>{cert.commonName}</h4>
                <div className="cert-info">
                  <div className="info-row">
                    <span className="label">Serial:</span>
                    <span className="value">{cert.serialNumber}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Valid from:</span>
                    <span className="value">{formatDate(cert.validFrom)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Valid until:</span>
                    <span className="value">{formatDate(cert.validTo)}</span>
                  </div>
                  {cert.isExpired && (
                    <div className="expired-badge">Expired</div>
                  )}
                </div>
              </div>
              <div className="cert-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleDownload(cert.fileName, 'cert')}
                  title="Download Certificate"
                >
                  <FaDownload /> Cert
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleDownload(cert.fileName, 'key')}
                  title="Download Private Key"
                >
                  <FaKey /> Key
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(cert.fileName)}
                  title="Delete Certificate"
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

export default SSLManager;
