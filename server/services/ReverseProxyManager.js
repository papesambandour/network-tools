const Datastore = require('@seald-io/nedb');
const path = require('path');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ReverseProxyManager {
  constructor() {
    this.db = new Datastore({
      filename: path.join(__dirname, '../data/proxy-routes.db'),
      autoload: true
    });

    // Cache des agents proxy pour éviter de recréer les connexions
    this.proxyAgents = {};

    // Routes actives en mémoire
    this.activeRoutes = new Map();

    // Désactiver la vérification SSL pour les proxys internes
    // ⚠️ À utiliser uniquement dans un environnement de développement/interne
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  // Charger toutes les routes depuis la base de données
  async loadRoutesFromDb() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, routes) => {
        if (err) return reject(err);

        routes.forEach(route => {
          this.activeRoutes.set(route.path, {
            ...route,
            enabled: route.enabled !== false
          });
        });

        resolve(routes);
      });
    });
  }

  // Obtenir les agents HTTP/HTTPS pour un proxy donné
  getAgentsForProxy(proxyUrl) {
    if (!this.proxyAgents[proxyUrl]) {
      this.proxyAgents[proxyUrl] = {
        http: new HttpProxyAgent(proxyUrl),
        https: new HttpsProxyAgent(proxyUrl)
      };
      console.log(`[ReverseProxy] Agents créés pour le proxy ${proxyUrl}`);
    }
    return this.proxyAgents[proxyUrl];
  }

  // Ajouter une nouvelle route
  async addRoute(routeConfig) {
    const { path, target, headers, type, proxy, description, enabled } = routeConfig;

    // Validation
    if (!path || !target || !type) {
      throw new Error('Les champs path, target et type sont requis');
    }

    if (!['api', 'stream'].includes(type)) {
      throw new Error('Le type doit être "api" ou "stream"');
    }

    if (!path.startsWith('/')) {
      throw new Error('Le path doit commencer par /');
    }

    // Vérifier si la route existe déjà
    const existing = await this.getRouteByPath(path);
    if (existing) {
      throw new Error(`La route ${path} existe déjà`);
    }

    const newRoute = {
      path,
      target,
      headers: headers || {},
      type,
      proxy: proxy || null,
      description: description || '',
      enabled: enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.db.insert(newRoute, (err, doc) => {
        if (err) return reject(err);

        this.activeRoutes.set(doc.path, doc);
        console.log(`[ReverseProxy] Route ajoutée: ${doc.path} -> ${doc.target}`);
        resolve(doc);
      });
    });
  }

  // Mettre à jour une route
  async updateRoute(routeId, updates) {
    return new Promise((resolve, reject) => {
      this.db.update(
        { _id: routeId },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnUpdatedDocs: true },
        (err, numAffected, doc) => {
          if (err) return reject(err);
          if (numAffected === 0) return reject(new Error('Route non trouvée'));

          // Mettre à jour le cache
          if (doc.path) {
            this.activeRoutes.set(doc.path, doc);
          }

          console.log(`[ReverseProxy] Route mise à jour: ${doc.path}`);
          resolve(doc);
        }
      );
    });
  }

  // Supprimer une route
  async deleteRoute(routeId) {
    return new Promise((resolve, reject) => {
      // D'abord récupérer la route pour connaître son path
      this.db.findOne({ _id: routeId }, (err, route) => {
        if (err) return reject(err);
        if (!route) return reject(new Error('Route non trouvée'));

        this.db.remove({ _id: routeId }, {}, (err, numRemoved) => {
          if (err) return reject(err);

          // Supprimer du cache
          this.activeRoutes.delete(route.path);

          console.log(`[ReverseProxy] Route supprimée: ${route.path}`);
          resolve({ success: true, numRemoved });
        });
      });
    });
  }

  // Récupérer une route par son path
  async getRouteByPath(path) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ path }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  }

  // Récupérer toutes les routes
  async getAllRoutes() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  }

  // Activer/désactiver une route
  async toggleRoute(routeId, enabled) {
    return this.updateRoute(routeId, { enabled });
  }

  // Middleware pour gérer les routes API (via Axios)
  getApiMiddleware() {
    return async (req, res, next) => {
      const pathSegments = req.path.split('/').filter(Boolean);
      if (pathSegments.length === 0) return next();

      const routeKey = '/' + pathSegments[0];
      const route = this.activeRoutes.get(routeKey);

      // Si pas de route ou route désactivée ou pas de type API
      if (!route || !route.enabled || route.type !== 'api') {
        return next();
      }

      try {
        const remainingPath = '/' + pathSegments.slice(1).join('/');
        const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
        const targetUrl = route.target + remainingPath + queryString;

        console.log(`[ReverseProxy API] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

        // Préparation des headers
        const headers = {};
        const allowedHeaders = [
          'accept',
          'accept-language',
          'accept-encoding',
          'cookie',
          'user-agent',
          'authorization',
          'referer',
          'origin',
          'content-type'
        ];

        for (const key of Object.keys(req.headers)) {
          if (allowedHeaders.includes(key.toLowerCase())) {
            headers[key] = req.headers[key];
          }
        }

        // Fusionner avec les headers configurés
        Object.assign(headers, route.headers);

        // Ajouter les headers essentiels
        headers['Host'] = new URL(route.target).hostname;
        headers['Connection'] = 'Keep-Alive';

        // Configuration Axios
        const axiosConfig = {
          method: req.method,
          url: targetUrl,
          headers,
          data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? req.body : undefined,
          timeout: 30000,
          responseType: 'arraybuffer',
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          validateStatus: () => true
        };

        // Si un proxy est configuré
        if (route.proxy) {
          const { http, https } = this.getAgentsForProxy(route.proxy);
          axiosConfig.httpAgent = http;
          axiosConfig.httpsAgent = https;
          axiosConfig.proxy = false; // Indispensable
        }

        const response = await axios(axiosConfig);
        const responseHeaders = { ...response.headers };
        delete responseHeaders['transfer-encoding'];
        delete responseHeaders['connection'];

        res.status(response.status).set(responseHeaders).send(response.data);

      } catch (err) {
        console.error('[ReverseProxy API ERROR]', err.message);

        if (err.response) {
          const responseHeaders = { ...err.response.headers };
          delete responseHeaders['transfer-encoding'];
          delete responseHeaders['connection'];
          res.status(err.response.status).set(responseHeaders).send(err.response.data);
        } else {
          res.status(500).json({
            error: 'Erreur proxy',
            message: err.message,
            details: err.code
          });
        }
      }
    };
  }

  // Créer un middleware pour une route Stream spécifique
  createStreamMiddleware(route) {
    if (!route.enabled) {
      return (req, res, next) => next();
    }

    const agent = route.proxy
      ? (route.target.startsWith('https')
          ? this.getAgentsForProxy(route.proxy).https
          : this.getAgentsForProxy(route.proxy).http)
      : undefined;

    return createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      agent,
      proxyTimeout: 60000,
      onProxyReq: (proxyReq, req) => {
        console.log(`[ReverseProxy STREAM] ${req.method} ${req.originalUrl} -> ${route.target}`);

        // Ajouter les headers personnalisés
        if (route.headers) {
          Object.entries(route.headers).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });
        }
      },
      onError: (err, req, res) => {
        console.error(`[ReverseProxy STREAM ERROR] ${err.message}`);
        if (!res.headersSent) {
          res.status(500).send('Erreur de streaming proxy');
        }
      }
    });
  }

  // Obtenir tous les middlewares de type stream
  getStreamMiddlewares() {
    const middlewares = [];

    for (const [path, route] of this.activeRoutes.entries()) {
      if (route.type === 'stream' && route.enabled) {
        middlewares.push({
          path,
          middleware: this.createStreamMiddleware(route)
        });
      }
    }

    return middlewares;
  }

  // Nettoyer les agents proxy
  clearProxyAgents() {
    this.proxyAgents = {};
    console.log('[ReverseProxy] Cache des agents proxy nettoyé');
  }
}

module.exports = ReverseProxyManager;