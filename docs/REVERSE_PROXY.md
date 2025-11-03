# Reverse Proxy Module

Module de reverse proxy dynamique avec support de backend et proxy servers.

## Fonctionnalités

- Ajout/Modification/Suppression de routes dynamiques
- Support de 2 types de proxy:
  - **API**: Routes utilisant Axios (idéal pour les API REST)
  - **Stream**: Routes utilisant http-proxy-middleware (idéal pour le streaming, fichiers, WebSockets)
- Configuration de headers HTTP personnalisés
- Support de proxy servers intermédiaires
- Activation/Désactivation des routes en temps réel
- Test de connectivité avant ajout d'une route
- Statistiques et monitoring

## API Endpoints

### Routes de gestion

```bash
# Récupérer toutes les routes
GET /api/reverse-proxy/routes

# Récupérer une route spécifique
GET /api/reverse-proxy/routes/:id

# Créer une nouvelle route
POST /api/reverse-proxy/routes
Body: {
  "path": "/api-auth",
  "target": "http://backend.example.com",
  "type": "api",
  "proxy": "http://10.34.78.16:3128",
  "headers": {
    "User-Agent": "MyApp/1.0"
  },
  "description": "Route vers l'API d'authentification",
  "enabled": true
}

# Mettre à jour une route
PUT /api/reverse-proxy/routes/:id
Body: { ... }

# Supprimer une route
DELETE /api/reverse-proxy/routes/:id

# Activer/Désactiver une route
PATCH /api/reverse-proxy/routes/:id/toggle
Body: { "enabled": true }

# Tester une configuration
POST /api/reverse-proxy/test
Body: {
  "target": "http://backend.example.com",
  "proxy": "http://10.34.78.16:3128"
}

# Statistiques
GET /api/reverse-proxy/stats
```

## Utilisation

### Via l'interface Web

1. Démarrer le serveur: `npm run dev`
2. Ouvrir l'interface: http://localhost:3001
3. Cliquer sur "Reverse Proxy Manager"
4. Cliquer sur "Nouvelle Route"
5. Remplir le formulaire:
   - **Path**: Le chemin de la route (ex: `/api-auth`)
   - **Target**: URL du backend cible
   - **Type**: `api` ou `stream`
   - **Proxy** (optionnel): URL du proxy intermédiaire
   - **Headers** (optionnel): Headers HTTP personnalisés
   - **Description**: Description de la route

### Fonctionnalités de l'interface

- **Internal URL avec copie**: Chaque route affiche l'URL interne accessible (ex: `http://localhost:3001/api-auth`) avec un bouton de copie rapide
  - ⚠️ **Important**: Cette URL correspond au **serveur backend** (port 3001), pas au client React (port 3000)
  - C'est cette URL que vous devez utiliser dans Postman, curl, ou depuis vos applications
- **Backend Target**: L'URL du backend vers lequel les requêtes sont redirigées
- **Proxy Server**: Le serveur proxy intermédiaire (si configuré)
- **Test de connectivité**: Tester la route avant de la créer
- **Statistiques en temps réel**: Voir le nombre de routes actives, désactivées, par type, etc.

### Architecture des URLs

```
┌─────────────────────────────────────────────────────────────┐
│ Client React (Interface Web)                                │
│ URL: http://localhost:3000                                  │
│                                                              │
│ Affiche l'interface de gestion des routes                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Gère via API REST
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Serveur Backend (Reverse Proxy)                            │
│ URL: http://localhost:3001                                  │
│                                                              │
│ Routes exposées:                                            │
│  - /api-auth → http://backend1.com                         │
│  - /glpi     → http://backend2.com                         │
│  - /files    → http://backend3.com                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Redirige vers
                           ↓
                    Backend servers
```

**Exemple d'utilisation**:
- Pour gérer les routes: Ouvrir `http://localhost:3000` dans le navigateur
- Pour utiliser une route: Faire une requête à `http://localhost:3001/api-auth`

### Exemple de configuration

```javascript
{
  "path": "/api-auth",
  "target": "http://ws.pfi.colis.intra.laposte.fr",
  "type": "api",
  "proxy": "http://10.34.78.16:3128",
  "headers": {
    "User-Agent": "curl/7.68.0",
    "Authorization": "Bearer token123"
  },
  "description": "API d'authentification via proxy interne",
  "enabled": true
}
```

### Via l'API REST

```bash
# Créer une route API
curl -X POST http://localhost:3001/api/reverse-proxy/routes \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/api-users",
    "target": "http://backend.example.com/users",
    "type": "api",
    "enabled": true
  }'

# Créer une route Stream (pour téléchargements, WebSocket, etc.)
curl -X POST http://localhost:3001/api/reverse-proxy/routes \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/files",
    "target": "http://fileserver.example.com",
    "type": "stream",
    "enabled": true
  }'

# Lister toutes les routes
curl http://localhost:3001/api/reverse-proxy/routes

# Désactiver une route
curl -X PATCH http://localhost:3001/api/reverse-proxy/routes/:id/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## Types de routes

### Type "api"
- Utilise Axios pour les requêtes
- Idéal pour les API REST classiques
- Supporte tous les verbes HTTP (GET, POST, PUT, DELETE, etc.)
- Gestion automatique des headers
- Timeout configurable
- Support complet des proxy intermédiaires

### Type "stream"
- Utilise http-proxy-middleware
- Idéal pour:
  - Téléchargement de fichiers volumineux
  - Streaming vidéo/audio
  - WebSocket
  - Server-Sent Events (SSE)
- Streaming en temps réel sans buffer
- Support des connexions longues

## Configuration avec proxy

Lorsque vous utilisez un proxy intermédiaire:

```javascript
{
  "path": "/api-internal",
  "target": "http://internal-api.company.local",
  "proxy": "http://proxy.company.local:3128",
  "type": "api"
}
```

Le flux de requête sera:
```
Client -> Network Tools (3001) -> Proxy (3128) -> Backend
```

## Sécurité

⚠️ **Note importante**: Le code désactive actuellement la vérification SSL (`NODE_TLS_REJECT_UNAUTHORIZED = '0'`) pour faciliter les tests avec des proxys internes.

**Pour la production, vous devriez**:
1. Activer la vérification SSL
2. Configurer les certificats appropriés
3. Utiliser HTTPS pour les communications sensibles
4. Mettre en place une authentification sur les routes API

## Exemples de cas d'usage

### 1. Proxy vers une API interne
```javascript
{
  "path": "/internal-api",
  "target": "http://10.0.1.100:8080",
  "type": "api",
  "headers": {
    "X-Internal-Key": "secret123"
  }
}
```

### 2. Stream de fichiers volumineux
```javascript
{
  "path": "/downloads",
  "target": "http://fileserver.local:9000",
  "type": "stream"
}
```

### 3. API publique via proxy d'entreprise
```javascript
{
  "path": "/github-api",
  "target": "https://api.github.com",
  "type": "api",
  "proxy": "http://corporate-proxy:8080",
  "headers": {
    "Authorization": "token ghp_xxxxx"
  }
}
```

## Structure de la base de données

Les routes sont stockées dans `server/data/proxy-routes.db` (NeDB).

Schéma:
```javascript
{
  _id: "unique-id",
  path: "/api-route",
  target: "http://backend.com",
  type: "api" | "stream",
  proxy: "http://proxy:3128" | null,
  headers: { "Key": "Value" },
  description: "Description",
  enabled: true,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Route ne fonctionne pas
1. Vérifier que la route est activée (`enabled: true`)
2. Tester la connectivité avec l'endpoint `/api/reverse-proxy/test`
3. Vérifier les logs du serveur
4. Vérifier que le path ne commence pas déjà par `/api`

### Problèmes de proxy
1. Vérifier que le proxy est accessible
2. Vérifier la syntaxe de l'URL du proxy: `http://host:port`
3. Tester sans proxy d'abord

### Headers non transmis
- Pour les routes API, les headers sont fusionnés automatiquement
- Pour les routes Stream, les headers personnalisés sont ajoutés manuellement

## Performance

- Les agents de proxy sont mis en cache pour éviter de recréer les connexions
- Les routes sont chargées en mémoire au démarrage
- Les middlewares Stream sont enregistrés dynamiquement

## Développement

Fichiers principaux:
- `server/services/ReverseProxyManager.js`: Service de gestion
- `server/routes/reverseProxy.js`: Routes API
- `client/src/components/ReverseProxyManager.js`: Interface React
- `client/src/components/ReverseProxyManager.css`: Styles
