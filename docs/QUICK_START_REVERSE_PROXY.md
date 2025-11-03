# 🚀 Quick Start - Reverse Proxy Manager

## ⚡ En 30 secondes

```bash
# 1. Démarrer le serveur
npm run dev

# 2. Ouvrir le navigateur
http://localhost:3000

# 3. Créer une route
Cliquer sur "Reverse Proxy Manager" → "Nouvelle Route"

# 4. Copier l'URL
Cliquer sur 📋 à côté de "Internal URL"

# 5. Utiliser
curl http://localhost:3001/votre-route
```

## 📝 Exemple concret

### Créer une route vers JSONPlaceholder

**Interface Web:**
```
Path: /api-test
Target: https://jsonplaceholder.typicode.com
Type: API
Enabled: ✓
```

**Résultat:**
```
Internal URL: http://localhost:3001/api-test [📋]
```

**Utilisation:**
```bash
# Au lieu de:
curl https://jsonplaceholder.typicode.com/users/1

# Utilisez:
curl http://localhost:3001/api-test/users/1
```

## 🎯 Cas d'usage rapides

### 1. Bypass CORS (3 minutes)

**Problème:** Votre app React ne peut pas appeler une API externe

**Solution:**
1. Créer une route: `/external-api` → `https://api.example.com`
2. Dans React: `fetch('http://localhost:3001/external-api/data')`
3. ✅ Pas de CORS!

### 2. Proxy d'entreprise (5 minutes)

**Problème:** Vous devez passer par un proxy pour accéder aux APIs

**Solution:**
1. Créer une route avec proxy:
   ```
   Path: /internal-api
   Target: http://internal-api.company.local
   Proxy: http://corporate-proxy:8080
   ```
2. `curl http://localhost:3001/internal-api/endpoint`
3. ✅ Route via le proxy!

### 3. Authentification centralisée (5 minutes)

**Problème:** Gérer plusieurs tokens d'API différents

**Solution:**
1. Créer plusieurs routes avec headers:
   ```
   Route 1: /github → https://api.github.com
   Headers: Authorization: token ghp_xxx

   Route 2: /gitlab → https://gitlab.com/api/v4
   Headers: Private-Token: glpat_xxx
   ```
2. Utiliser sans gérer les tokens:
   ```bash
   curl http://localhost:3001/github/user
   curl http://localhost:3001/gitlab/projects
   ```
3. ✅ Authentification automatique!

## 🔥 Features principales

| Feature | Description | Icon |
|---------|-------------|------|
| **Copie rapide** | Un clic pour copier l'URL | 📋 |
| **Test intégré** | Tester avant de créer | 🧪 |
| **Stats live** | Voir les métriques en temps réel | 📊 |
| **On/Off** | Activer/désactiver instantanément | ⚡ |
| **Types** | API (REST) ou Stream (fichiers) | 🔀 |

## 💡 Tips

### Nommage des routes
```bash
✅ /api-users
✅ /github-api
✅ /downloads

❌ /a
❌ /route1
❌ /test
```

### Choisir le type

**API** → Pour:
- APIs REST (GET, POST, PUT, DELETE)
- Réponses JSON
- Requêtes HTTP standards

**Stream** → Pour:
- Téléchargement de fichiers
- Upload de fichiers
- WebSocket
- Streaming vidéo/audio

### Headers utiles

```javascript
// Changer le User-Agent
"User-Agent": "MyApp/1.0"

// Authentification
"Authorization": "Bearer token123"

// CORS custom
"Origin": "https://myapp.com"

// Content-Type
"Content-Type": "application/json"
```

## 🎬 Workflow visuel

```
┌─────────────┐
│  Browser    │ Ouvrir http://localhost:3000
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Reverse Proxy Manager              │
│  [+ Nouvelle Route]                 │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Formulaire                         │
│  • Path: /api-auth                  │
│  • Target: http://backend.com       │
│  • Type: API                        │
│  • [Tester] [Créer]                 │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Route créée                        │
│  Internal URL: http://...  [📋]     │
└──────┬──────────────────────────────┘
       │ Clic sur 📋
       ↓
┌─────────────────────────────────────┐
│  URL copiée!                        │
│  ✓ http://localhost:3001/api-auth   │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Terminal                           │
│  $ curl http://localhost:3001/...   │
└─────────────────────────────────────┘
```

## 🐛 Debug rapide

### La route ne fonctionne pas?

```bash
# 1. Vérifier que le serveur tourne
curl http://localhost:3001/api/health

# 2. Vérifier que la route existe
# → Aller dans l'interface, voir la liste

# 3. Vérifier que la route est activée
# → Badge vert = OK, badge gris = désactivée

# 4. Tester la connectivité
# → Bouton "Tester" dans l'interface

# 5. Voir les logs
# → Console du serveur (npm run dev)
```

### URL ne se copie pas?

```bash
# Vérifier que le navigateur supporte Clipboard API
# → Essayer dans Chrome/Firefox/Edge (pas IE)

# Vérifier HTTPS
# → localhost fonctionne en HTTP, pas de souci

# Copier manuellement
# → Sélectionner l'URL et Ctrl+C / Cmd+C
```

## 📚 Documentation complète

Pour aller plus loin:

1. **[REVERSE_PROXY.md](./REVERSE_PROXY.md)** - Documentation complète
2. **[REVERSE_PROXY_USAGE.md](./REVERSE_PROXY_USAGE.md)** - Guide détaillé
3. **[REVERSE_PROXY_EXAMPLE.md](./REVERSE_PROXY_EXAMPLE.md)** - Exemples
4. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Index complet

## 🎓 Exercices pratiques

### Exercice 1: Route simple (5 min)
```
Objectif: Créer une route vers JSONPlaceholder
Path: /json-api
Target: https://jsonplaceholder.typicode.com
Type: API
Test: curl http://localhost:3001/json-api/posts/1
```

### Exercice 2: Route avec proxy (10 min)
```
Objectif: Ajouter un proxy intermédiaire
Path: /proxied-api
Target: http://api.example.com
Proxy: http://your-proxy:3128
Type: API
Test: curl http://localhost:3001/proxied-api/endpoint
```

### Exercice 3: Headers personnalisés (10 min)
```
Objectif: Ajouter des headers
Path: /github
Target: https://api.github.com
Headers:
  - User-Agent: MyApp/1.0
  - Accept: application/vnd.github.v3+json
Type: API
Test: curl http://localhost:3001/github/users/octocat
```

### Exercice 4: Route Stream (10 min)
```
Objectif: Télécharger un fichier
Path: /files
Target: http://fileserver.local:9000
Type: Stream
Test: curl -O http://localhost:3001/files/document.pdf
```

## ✅ Checklist de démarrage

- [ ] Serveur démarré (`npm run dev`)
- [ ] Interface ouverte (http://localhost:3000)
- [ ] Module "Reverse Proxy Manager" trouvé
- [ ] Première route créée
- [ ] URL copiée
- [ ] Test avec curl réussi
- [ ] Route désactivée/réactivée
- [ ] Statistiques consultées

## 🎉 Bravo!

Vous êtes maintenant prêt à utiliser le Reverse Proxy Manager!

**Prochaines étapes:**
1. Créer des routes pour vos APIs
2. Centraliser vos authentifications
3. Bypasser les restrictions CORS
4. Simplifier vos configurations

---

**Besoin d'aide?** → Voir [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
**Questions?** → Consulter [REVERSE_PROXY_USAGE.md](./REVERSE_PROXY_USAGE.md)
