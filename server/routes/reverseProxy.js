const express = require('express');
const router = express.Router();

// GET /api/reverse-proxy/routes - Récupérer toutes les routes
router.get('/routes', async (req, res) => {
  try {
    const routes = await req.reverseProxyManager.getAllRoutes();
    res.json({
      success: true,
      routes
    });
  } catch (error) {
    console.error('Error fetching proxy routes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reverse-proxy/routes/:id - Récupérer une route par ID
router.get('/routes/:id', async (req, res) => {
  try {
    const route = await req.reverseProxyManager.db.findOneAsync({ _id: req.params.id });
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route non trouvée'
      });
    }
    res.json({
      success: true,
      route
    });
  } catch (error) {
    console.error('Error fetching proxy route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reverse-proxy/routes - Créer une nouvelle route
router.post('/routes', async (req, res) => {
  try {
    const { path, target, headers, type, proxy, description, enabled } = req.body;

    // Validation des champs requis
    if (!path || !target || !type) {
      return res.status(400).json({
        success: false,
        error: 'Les champs path, target et type sont requis'
      });
    }

    const newRoute = await req.reverseProxyManager.addRoute({
      path,
      target,
      headers: headers || {},
      type,
      proxy: proxy || null,
      description: description || '',
      enabled: enabled !== false
    });

    res.status(201).json({
      success: true,
      route: newRoute,
      message: 'Route créée avec succès'
    });
  } catch (error) {
    console.error('Error creating proxy route:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/reverse-proxy/routes/:id - Mettre à jour une route
router.put('/routes/:id', async (req, res) => {
  try {
    const { path, target, headers, type, proxy, description, enabled } = req.body;

    const updates = {};
    if (path !== undefined) updates.path = path;
    if (target !== undefined) updates.target = target;
    if (headers !== undefined) updates.headers = headers;
    if (type !== undefined) updates.type = type;
    if (proxy !== undefined) updates.proxy = proxy;
    if (description !== undefined) updates.description = description;
    if (enabled !== undefined) updates.enabled = enabled;

    const updatedRoute = await req.reverseProxyManager.updateRoute(req.params.id, updates);

    res.json({
      success: true,
      route: updatedRoute,
      message: 'Route mise à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating proxy route:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/reverse-proxy/routes/:id - Supprimer une route
router.delete('/routes/:id', async (req, res) => {
  try {
    await req.reverseProxyManager.deleteRoute(req.params.id);

    res.json({
      success: true,
      message: 'Route supprimée avec succès'
    });
  } catch (error) {
    console.error('Error deleting proxy route:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/reverse-proxy/routes/:id/toggle - Activer/désactiver une route
router.patch('/routes/:id/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Le champ enabled est requis'
      });
    }

    const updatedRoute = await req.reverseProxyManager.toggleRoute(req.params.id, enabled);

    res.json({
      success: true,
      route: updatedRoute,
      message: `Route ${enabled ? 'activée' : 'désactivée'} avec succès`
    });
  } catch (error) {
    console.error('Error toggling proxy route:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reverse-proxy/test - Tester une configuration de route
router.post('/test', async (req, res) => {
  try {
    const { target, proxy, headers } = req.body;

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'Le champ target est requis'
      });
    }

    const axios = require('axios');
    const { HttpProxyAgent } = require('http-proxy-agent');
    const { HttpsProxyAgent } = require('https-proxy-agent');

    const axiosConfig = {
      method: 'GET',
      url: target,
      timeout: 10000,
      validateStatus: () => true,
      headers: headers || {}
    };

    if (proxy) {
      const isHttps = target.startsWith('https');
      axiosConfig[isHttps ? 'httpsAgent' : 'httpAgent'] = isHttps
        ? new HttpsProxyAgent(proxy)
        : new HttpProxyAgent(proxy);
      axiosConfig.proxy = false;
    }

    const response = await axios(axiosConfig);

    res.json({
      success: true,
      test: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        reachable: response.status < 500
      }
    });
  } catch (error) {
    res.json({
      success: false,
      test: {
        reachable: false,
        error: error.message,
        code: error.code
      }
    });
  }
});

// GET /api/reverse-proxy/stats - Statistiques des routes
router.get('/stats', async (req, res) => {
  try {
    const routes = await req.reverseProxyManager.getAllRoutes();

    const stats = {
      total: routes.length,
      enabled: routes.filter(r => r.enabled).length,
      disabled: routes.filter(r => !r.enabled).length,
      byType: {
        api: routes.filter(r => r.type === 'api').length,
        stream: routes.filter(r => r.type === 'stream').length
      },
      withProxy: routes.filter(r => r.proxy).length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching proxy stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
