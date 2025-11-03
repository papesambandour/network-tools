# Guide d'utilisation du Reverse Proxy

## Comprendre les URLs

### Deux serveurs différents

1. **Interface de gestion (Client React)** 🖥️
   - URL: `http://localhost:3000`
   - Utilité: Créer, modifier, supprimer les routes
   - Technologie: React (interface graphique)

2. **Serveur Reverse Proxy (Backend)** 🔄
   - URL: `http://localhost:3001`
   - Utilité: Recevoir les requêtes et les rediriger vers les backends
   - Technologie: Express.js (serveur Node.js)

## Workflow complet

### Étape 1: Créer une route via l'interface

1. Ouvrir le navigateur: `http://localhost:3000`
2. Cliquer sur "Reverse Proxy Manager"
3. Cliquer sur "Nouvelle Route"
4. Remplir:
   ```
   Path: /api-auth
   Target: http://ws.pfi.colis.intra.laposte.fr
   Type: API
   Proxy: http://10.34.78.16:3128
   ```
5. Cliquer sur "Créer"

### Étape 2: Récupérer l'URL interne

Dans la liste des routes, vous verrez:
```
Internal URL: http://localhost:3001/api-auth [📋]
Backend Target: http://ws.pfi.colis.intra.laposte.fr
Proxy Server: http://10.34.78.16:3128
```

Cliquer sur le bouton 📋 pour copier l'URL: `http://localhost:3001/api-auth`

### Étape 3: Utiliser la route

#### Avec curl
```bash
# Simple GET
curl http://localhost:3001/api-auth/users

# POST avec données
curl -X POST http://localhost:3001/api-auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Avec headers personnalisés
curl http://localhost:3001/api-auth/profile \
  -H "Authorization: Bearer token123"
```

#### Avec Postman
1. Créer une nouvelle requête
2. Méthode: GET (ou POST, PUT, DELETE selon besoin)
3. URL: `http://localhost:3001/api-auth/users`
4. Headers: (optionnel, selon votre configuration)
5. Send

#### Avec JavaScript (fetch)
```javascript
// Dans votre application frontend
fetch('http://localhost:3001/api-auth/users')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// POST avec données
fetch('http://localhost:3001/api-auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'user',
    password: 'pass'
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Avec Python (requests)
```python
import requests

# GET
response = requests.get('http://localhost:3001/api-auth/users')
print(response.json())

# POST
payload = {'username': 'user', 'password': 'pass'}
response = requests.post('http://localhost:3001/api-auth/login', json=payload)
print(response.json())
```

## Exemples de cas d'usage

### Cas 1: API interne d'entreprise

**Problème**: Vous ne pouvez pas accéder à `http://internal-api.company.local` directement depuis votre machine

**Solution**: Créer une route proxy
```
Path: /company-api
Target: http://internal-api.company.local
Proxy: http://corporate-proxy:8080
```

**Utilisation**:
```bash
# Au lieu de:
curl http://internal-api.company.local/users  # ❌ Ne fonctionne pas

# Utiliser:
curl http://localhost:3001/company-api/users  # ✅ Fonctionne!
```

### Cas 2: Contourner le CORS

**Problème**: Votre application React ne peut pas appeler une API externe à cause du CORS

**Solution**: Créer une route proxy
```
Path: /external-api
Target: https://api.example.com
Type: API
```

**Utilisation**:
```javascript
// Au lieu de:
fetch('https://api.example.com/data')  // ❌ CORS error

// Utiliser:
fetch('http://localhost:3001/external-api/data')  // ✅ Pas de CORS!
```

### Cas 3: Centraliser les authentifications

**Problème**: Plusieurs microservices avec différents tokens d'authentification

**Solution**: Créer plusieurs routes avec headers
```
Route 1:
Path: /service-a
Target: http://service-a.com
Headers: { "Authorization": "Bearer token-a" }

Route 2:
Path: /service-b
Target: http://service-b.com
Headers: { "Authorization": "Bearer token-b" }
```

**Utilisation**:
```bash
# Pas besoin de gérer les tokens dans votre application
curl http://localhost:3001/service-a/data
curl http://localhost:3001/service-b/data
```

### Cas 4: Download de fichiers volumineux

**Problème**: Télécharger un fichier depuis un serveur distant

**Solution**: Créer une route Stream
```
Path: /downloads
Target: http://fileserver.local:9000
Type: Stream
```

**Utilisation**:
```bash
# Télécharger un fichier
curl -O http://localhost:3001/downloads/bigfile.zip

# Ou dans le navigateur
http://localhost:3001/downloads/video.mp4
```

## Différences entre les types

### Type API (Axios)

**Quand l'utiliser**:
- APIs REST classiques
- JSON responses
- GET, POST, PUT, DELETE
- Requêtes avec timeout

**Exemple**:
```javascript
// Configuration
{
  "path": "/api-users",
  "target": "http://api.example.com/users",
  "type": "api"
}

// Utilisation
fetch('http://localhost:3001/api-users')
  .then(res => res.json())  // JSON automatique
```

### Type Stream (http-proxy-middleware)

**Quand l'utiliser**:
- Téléchargement de fichiers
- Upload de fichiers
- Streaming vidéo/audio
- WebSocket
- Server-Sent Events (SSE)

**Exemple**:
```javascript
// Configuration
{
  "path": "/files",
  "target": "http://fileserver.com",
  "type": "stream"
}

// Utilisation - Téléchargement
<a href="http://localhost:3001/files/document.pdf" download>
  Télécharger
</a>

// WebSocket
const ws = new WebSocket('ws://localhost:3001/websocket');
```

## Debugging

### Voir les logs du serveur

Les requêtes sont loggées dans la console du serveur:
```
[PROXY API] GET /api-auth/users -> http://ws.pfi.colis.intra.laposte.fr/users
[PROXY STREAM] GET /files/document.pdf -> http://fileserver.com/document.pdf
```

### Tester une route

Avant de créer une route, utilisez le bouton "Tester" dans l'interface:
- ✅ Connexion réussie (Status: 200)
- ❌ Échec: Connection timeout

### Vérifier qu'une route est active

Dans l'interface, vérifiez:
- Badge vert = Route active
- Badge gris = Route désactivée
- Icône ⚡ pour activer/désactiver

## Bonnes pratiques

### 1. Nommer les routes clairement
```bash
✅ /api-auth
✅ /github-api
✅ /files-download

❌ /a
❌ /route1
❌ /test
```

### 2. Utiliser le bon type
```bash
# API REST → Type: API
/api-users
/api-products
/api-orders

# Fichiers/Streaming → Type: Stream
/files
/downloads
/websocket
```

### 3. Tester avant de déployer
1. Créer la route
2. Cliquer sur "Tester"
3. Vérifier le résultat
4. Tester avec curl
5. Utiliser dans votre application

### 4. Documentation
Ajouter une description claire à chaque route:
```
Description: API d'authentification - endpoints: /login, /logout, /refresh
```

## Troubleshooting

### "Cannot GET /api-auth"
- ✅ Vérifier que la route existe dans l'interface
- ✅ Vérifier que la route est activée (pas de badge "Désactivée")
- ✅ Vérifier l'URL: `http://localhost:3001` (pas 3000)

### "Connection timeout"
- ✅ Vérifier que le backend est accessible
- ✅ Vérifier que le proxy (si configuré) est accessible
- ✅ Tester avec le bouton "Tester" dans l'interface

### "CORS error"
- ✅ Si l'erreur vient de votre app React, utilisez `http://localhost:3001` et non le backend directement
- ✅ Le reverse proxy gère automatiquement le CORS

### "404 Not Found"
- ✅ Vérifier le path exact: `/api-auth` vs `/api-auth/`
- ✅ Vérifier que le backend retourne bien une réponse
- ✅ Vérifier les logs du serveur pour voir la requête complète

## Résumé visuel

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW COMPLET                             │
└─────────────────────────────────────────────────────────────────┘

1️⃣  Ouvrir l'interface
    → http://localhost:3000
    → Cliquer sur "Reverse Proxy Manager"

2️⃣  Créer une route
    → Bouton "Nouvelle Route"
    → Remplir le formulaire
    → Cliquer sur "Tester" (optionnel)
    → Créer

3️⃣  Copier l'URL interne
    → Internal URL: http://localhost:3001/api-auth
    → Cliquer sur le bouton 📋

4️⃣  Utiliser dans votre code
    → curl http://localhost:3001/api-auth
    → fetch('http://localhost:3001/api-auth')
    → requests.get('http://localhost:3001/api-auth')

5️⃣  Profiter! 🎉
    → Les requêtes sont automatiquement redirigées
    → Les headers sont ajoutés
    → Le proxy est utilisé (si configuré)
```
