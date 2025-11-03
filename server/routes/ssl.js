const express = require('express');
const router = express.Router();
const SSLManager = require('../services/SSLManager');

const sslManager = new SSLManager();

// Generate new SSL certificate
router.post('/generate', (req, res) => {
  try {
    const options = req.body;
    const result = sslManager.generateCertificate(options);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all certificates
router.get('/', (req, res) => {
  try {
    const certificates = sslManager.getAllCertificates();
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific certificate
router.get('/:fileName', (req, res) => {
  try {
    const cert = sslManager.getCertificate(req.params.fileName);
    res.json({ success: true, data: cert });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Download certificate
router.get('/:fileName/download', (req, res) => {
  try {
    const cert = sslManager.getCertificate(req.params.fileName);
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
    res.send(cert.certificate);
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Download private key
router.get('/:fileName/download-key', (req, res) => {
  try {
    const cert = sslManager.getCertificate(req.params.fileName);
    const keyFileName = req.params.fileName.replace('cert_', 'key_');
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="${keyFileName}"`);
    res.send(cert.privateKey);
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Delete certificate
router.delete('/:fileName', (req, res) => {
  try {
    const result = sslManager.deleteCertificate(req.params.fileName);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
