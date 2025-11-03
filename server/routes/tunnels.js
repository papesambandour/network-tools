const express = require('express');
const router = express.Router();

// Get all active tunnels
router.get('/', (req, res) => {
  try {
    const tunnels = req.tunnelManager.getAllTunnels();
    res.json({ success: true, data: tunnels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get saved tunnel configurations
router.get('/saved', async (req, res) => {
  try {
    const savedTunnels = await req.tunnelManager.getSavedTunnels();
    res.json({ success: true, data: savedTunnels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new tunnel
router.post('/', async (req, res) => {
  try {
    const tunnel = await req.tunnelManager.createTunnel(req.body);
    res.json({ success: true, data: tunnel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific tunnel info
router.get('/:id', (req, res) => {
  try {
    const tunnel = req.tunnelManager.getTunnelInfo(req.params.id);
    if (!tunnel) {
      return res.status(404).json({ success: false, error: 'Tunnel not found' });
    }
    res.json({ success: true, data: tunnel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Close tunnel (disconnect but keep in database)
router.post('/:id/close', (req, res) => {
  try {
    const result = req.tunnelManager.closeTunnel(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start/restart a disconnected tunnel
router.post('/:id/start', async (req, res) => {
  try {
    const result = await req.tunnelManager.startTunnel(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tunnel configuration (must be disconnected)
router.put('/:id', async (req, res) => {
  try {
    const result = await req.tunnelManager.updateTunnel(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check tunnel status/health
router.post('/:id/check', async (req, res) => {
  try {
    const result = await req.tunnelManager.checkTunnelStatus(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete tunnel completely (remove from database)
router.delete('/:id', (req, res) => {
  try {
    const result = req.tunnelManager.deleteTunnel(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete saved tunnel configuration
router.delete('/saved/:id', async (req, res) => {
  try {
    await req.tunnelManager.deleteSavedTunnel(req.params.id);
    res.json({ success: true, message: 'Tunnel configuration deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
