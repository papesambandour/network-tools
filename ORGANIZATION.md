# 📁 Organisation des fichiers - Network Tools

## Structure du projet

```
network-tools/
├── 📄 README.md                    # Guide de démarrage principal
├── 📄 ARCHITECTURE.md              # Architecture + Documentation complète
├── 📄 ORGANIZATION.md              # Ce fichier - Organisation
│
├── 📁 server/                      # Backend Node.js
│   ├── index.js
│   ├── services/
│   │   ├── TunnelManager.js
│   │   ├── SSLManager.js
│   │   ├── SSLServerManager.js
│   │   ├── SSHTerminalManager.js
│   │   └── ReverseProxyManager.js  ⭐
│   ├── routes/
│   │   ├── tunnels.js
│   │   ├── ssl.js
│   │   ├── sslServers.js
│   │   └── reverseProxy.js         ⭐
│   └── data/
│       ├── tunnels.db
│       ├── ssl_servers.db
│       └── proxy-routes.db         ⭐
│
├── 📁 client/                      # Frontend React
│   └── src/
│       ├── components/
│       │   ├── ModuleHome.js
│       │   ├── TunnelManager.js
│       │   ├── SSLManager.js
│       │   ├── SSLServerManager.js
│       │   ├── SSHTerminal.js
│       │   └── ReverseProxyManager.js  ⭐
│       └── ...
│
├── 🧪 test-reverse-proxy.sh       # Tests automatisés
├── 🚀 start.sh                    # Script de démarrage
└── 📦 package.json                # Configuration npm
```

## Fichiers à la racine

Seulement les fichiers essentiels:

- **README.md** - Point d'entrée de la documentation et guide de démarrage
- **ARCHITECTURE.md** - Architecture technique ET documentation complète consolidée
- **ORGANIZATION.md** - Ce fichier (organisation du projet)
- **package.json** - Configuration du projet
- **start.sh** - Script de démarrage
- **test-reverse-proxy.sh** - Tests du reverse proxy

## Documentation consolidée

### Nouvelle organisation (v1.2.1)

Toute la documentation est maintenant consolidée dans **ARCHITECTURE.md** pour une meilleure accessibilité:

**ARCHITECTURE.md contient:**
- Architecture technique complète
- Documentation du module Reverse Proxy
  - Vue d'ensemble et fonctionnalités
  - Architecture backend et frontend
  - API endpoints
  - Guide d'utilisation complet
  - Exemples (curl, JavaScript, Python)
  - Cas d'usage concrets
  - Visual examples (route cards, request flow)
  - Troubleshooting
  - Performance et sécurité
  - Quick start (30 secondes)
  - Best practices
  - Bug fixes et changelog
- Statistiques du projet
- Guide de développement

## Principe d'organisation

### Racine = Essentiel + Documentation
Uniquement les fichiers nécessaires pour:
- **Démarrer** (README.md)
- **Comprendre l'architecture** (ARCHITECTURE.md)
- **Configurer le projet** (package.json)
- **Lancer l'application** (start.sh)
- **Tester** (test-reverse-proxy.sh)

### Plus de dossier docs/
La documentation n'est plus dispersée dans multiples fichiers MD. Tout est consolidé dans ARCHITECTURE.md pour:
- ✅ **Simplicité** - Un seul fichier à consulter
- ✅ **Navigation facile** - Table des matières avec ancres
- ✅ **Maintenance** - Un seul fichier à maintenir
- ✅ **Cohérence** - Documentation unifiée

## Navigation

### Pour les nouveaux utilisateurs
1. **[README.md](./README.md)** - Commencer ici
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Section "Quick Start" pour le reverse proxy

### Pour la documentation complète
**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Tout est dans ce fichier:
- Architecture technique
- Documentation des modules
- Reverse Proxy (guide complet, exemples, troubleshooting)
- API Documentation
- Exemples de code
- Développement

### Pour l'architecture technique
**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture complète:
- Backend structure
- Frontend structure
- Services et routes
- Database schemas
- API endpoints

## Avantages de cette organisation

✅ **Racine ultra-propre** - Seulement 3 fichiers de documentation
✅ **Documentation consolidée** - Tout dans ARCHITECTURE.md
✅ **Navigation facile** - Table des matières avec ancres
✅ **Maintenance simplifiée** - Un seul fichier à maintenir
✅ **Recherche facilitée** - Ctrl+F dans un seul fichier
✅ **Cohérence** - Documentation unifiée et structurée

## Liens rapides

| Besoin | Fichier / Section |
|--------|-------------------|
| Démarrer rapidement | [README.md](./README.md) |
| Architecture complète | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Documentation reverse proxy | [ARCHITECTURE.md - Reverse Proxy Module](./ARCHITECTURE.md#reverse-proxy-module) |
| Quick Start reverse proxy | [ARCHITECTURE.md - Quick Start](./ARCHITECTURE.md#quick-start) |
| API Documentation | [ARCHITECTURE.md - API Documentation](./ARCHITECTURE.md#api-documentation) |
| Exemples d'utilisation | [ARCHITECTURE.md - Examples](./ARCHITECTURE.md#examples) |

## Historique des changements

### Version 1.2.1 - 2025-11-03

**Changements majeurs:**
- ❌ Suppression du dossier `docs/` (10 fichiers MD)
- ✅ Consolidation de toute la documentation dans `ARCHITECTURE.md`
- ✅ Mise à jour des liens dans `README.md`
- ✅ Structure simplifiée: 3 fichiers MD à la racine au lieu de 13

**Fichiers supprimés:**
- `docs/README.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/REVERSE_PROXY.md`
- `docs/REVERSE_PROXY_USAGE.md`
- `docs/REVERSE_PROXY_EXAMPLE.md`
- `docs/REVERSE_PROXY_SUMMARY.md`
- `docs/CHANGELOG_REVERSE_PROXY.md`
- `docs/QUICK_START_REVERSE_PROXY.md`
- `docs/UPDATES_SUMMARY.md`
- `docs/COMPLETION_REPORT.md`

**Contenu conservé:**
Tout le contenu de ces fichiers a été intégré dans `ARCHITECTURE.md` sous la section "Reverse Proxy Module"

---

**Dernière mise à jour**: 03/11/2025
**Version**: 1.2.1
