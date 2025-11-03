const express = require('express');
const router = express.Router();
const SSLServerManager = require('../services/SSLServerManager');

const sslServerManager = new SSLServerManager();

// Get all SSL servers
router.get('/', async (req, res) => {
  try {
    const servers = await sslServerManager.getAll();
    // Don't send passwords to client
    const sanitizedServers = servers.map(server => ({
      ...server,
      password: server.password ? '********' : null
    }));
    res.json({ success: true, data: sanitizedServers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific SSL server by ID
router.get('/:id', async (req, res) => {
  try {
    const server = await sslServerManager.getById(req.params.id);
    if (!server) {
      return res.status(404).json({ success: false, error: 'Server not found' });
    }
    // Don't send password to client
    res.json({
      success: true,
      data: {
        ...server,
        password: server.password ? '********' : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new SSL server
router.post('/', async (req, res) => {
  try {
    const { name, host, port, user, password, sshKeyPath, description } = req.body;

    // Validation
    if (!name || !host || !user) {
      return res.status(400).json({
        success: false,
        error: 'Name, host, and user are required'
      });
    }

    if (!password && !sshKeyPath) {
      return res.status(400).json({
        success: false,
        error: 'Either password or SSH key path is required'
      });
    }

    const server = await sslServerManager.create({
      name,
      host,
      port,
      user,
      password,
      sshKeyPath,
      description
    });

    res.json({
      success: true,
      data: {
        ...server,
        password: server.password ? '********' : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update SSL server
router.put('/:id', async (req, res) => {
  try {
    const { name, host, port, user, password, sshKeyPath, description } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (host !== undefined) updateData.host = host;
    if (port !== undefined) updateData.port = port;
    if (user !== undefined) updateData.user = user;
    if (description !== undefined) updateData.description = description;

    // Only update password if a new one is provided (not '********')
    if (password && password !== '********') {
      updateData.password = password;
    }

    if (sshKeyPath !== undefined) updateData.sshKeyPath = sshKeyPath;

    const server = await sslServerManager.update(req.params.id, updateData);

    res.json({
      success: true,
      data: {
        ...server,
        password: server.password ? '********' : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete SSL server
router.delete('/:id', async (req, res) => {
  try {
    const result = await sslServerManager.delete(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test connection to SSL server
router.post('/:id/test', async (req, res) => {
  try {
    const result = await sslServerManager.testConnection(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
