# 📁 Organisation des fichiers - Network Tools

## Structure du projet

```
network-tools/
├── 📄 README.md                    # Guide de démarrage principal
├── 📄 ARCHITECTURE.md              # Documentation architecture
├── 📄 ORGANIZATION.md              # Ce fichier - Organisation
│
├── 📁 docs/                        # Toute la documentation détaillée
│   ├── README.md                   # Index du dossier docs
│   ├── DOCUMENTATION_INDEX.md      # Navigation complète
│   │
│   ├── 🚀 Quick Start
│   │   └── QUICK_START_REVERSE_PROXY.md
│   │
│   ├── 📚 Documentation Reverse Proxy
│   │   ├── REVERSE_PROXY.md
│   │   ├── REVERSE_PROXY_USAGE.md
│   │   └── REVERSE_PROXY_EXAMPLE.md
│   │
│   ├── 🔧 Technique
│   │   ├── REVERSE_PROXY_SUMMARY.md
│   │   └── CHANGELOG_REVERSE_PROXY.md
│   │
│   └── 📊 Rapports
│       ├── UPDATES_SUMMARY.md
│       └── COMPLETION_REPORT.md
│
├── 📁 server/                      # Backend Node.js
│   ├── index.js
│   ├── services/
│   │   ├── TunnelManager.js
│   │   ├── SSLManager.js
│   │   ├── SSLServerManager.js
│   │   ├── SSHTerminalManager.js
│   │   └── ReverseProxyManager.js  ⭐ Nouveau!
│   ├── routes/
│   │   ├── tunnels.js
│   │   ├── ssl.js
│   │   ├── sslServers.js
│   │   └── reverseProxy.js         ⭐ Nouveau!
│   └── data/
│       ├── tunnels.db
│       ├── ssl_servers.db
│       └── proxy-routes.db         ⭐ Nouveau!
│
├── 📁 client/                      # Frontend React
│   └── src/
│       ├── components/
│       │   ├── ModuleHome.js
│       │   ├── TunnelManager.js
│       │   ├── SSLManager.js
│       │   ├── SSLServerManager.js
│       │   ├── SSHTerminal.js
│       │   └── ReverseProxyManager.js  ⭐ Nouveau!
│       └── ...
│
├── 🧪 test-reverse-proxy.sh       # Tests automatisés
├── 🚀 start.sh                    # Script de démarrage
└── 📦 package.json                # Configuration npm
```

## Fichiers à la racine

Seulement les fichiers essentiels:

- **README.md** - Point d'entrée de la documentation
- **ARCHITECTURE.md** - Architecture technique
- **ORGANIZATION.md** - Ce fichier
- **package.json** - Configuration du projet
- **start.sh** - Script de démarrage
- **test-reverse-proxy.sh** - Tests du reverse proxy

## Dossier docs/

Toute la documentation détaillée est organisée dans `docs/`:

### 📚 Navigation
- **README.md** - Index du dossier docs
- **DOCUMENTATION_INDEX.md** - Index complet avec guide

### 🚀 Démarrage rapide
- **QUICK_START_REVERSE_PROXY.md** - Guide rapide (30 secondes)

### 📖 Documentation utilisateur
- **REVERSE_PROXY.md** - Documentation complète
- **REVERSE_PROXY_USAGE.md** - Guide d'utilisation détaillé
- **REVERSE_PROXY_EXAMPLE.md** - Exemples visuels

### 🔧 Documentation technique
- **REVERSE_PROXY_SUMMARY.md** - Résumé technique
- **CHANGELOG_REVERSE_PROXY.md** - Historique des changements

### 📊 Rapports
- **UPDATES_SUMMARY.md** - Résumé des mises à jour v1.2.1
- **COMPLETION_REPORT.md** - Rapport de complétion

## Principe d'organisation

### Racine = Essentiel
Uniquement les fichiers nécessaires pour:
- Démarrer (README.md)
- Comprendre l'architecture (ARCHITECTURE.md)
- Configurer le projet (package.json)
- Lancer l'application (start.sh)

### docs/ = Documentation
Toute la documentation détaillée:
- Guides utilisateur
- Tutoriels
- Documentation technique
- Rapports et résumés
- Changelog

## Navigation

### Pour les nouveaux utilisateurs
1. **[README.md](./README.md)** - Commencer ici
2. **[docs/QUICK_START_REVERSE_PROXY.md](./docs/QUICK_START_REVERSE_PROXY.md)** - Démarrage rapide

### Pour la documentation complète
1. **[docs/README.md](./docs/README.md)** - Index du dossier docs
2. **[docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)** - Navigation complète

### Pour l'architecture
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture globale
2. **[docs/REVERSE_PROXY_SUMMARY.md](./docs/REVERSE_PROXY_SUMMARY.md)** - Détails reverse proxy

## Avantages de cette organisation

✅ **Racine propre** - Seulement 6 fichiers essentiels
✅ **Documentation organisée** - Tout dans docs/
✅ **Navigation facile** - Index et README dans docs/
✅ **Séparation claire** - Code vs Documentation
✅ **Liens à jour** - Tous les liens relatifs corrigés

## Liens rapides

| Besoin | Fichier |
|--------|---------|
| Démarrer rapidement | [README.md](./README.md) |
| Documentation reverse proxy | [docs/REVERSE_PROXY.md](./docs/REVERSE_PROXY.md) |
| Index complet | [docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) |
| Quick Start | [docs/QUICK_START_REVERSE_PROXY.md](./docs/QUICK_START_REVERSE_PROXY.md) |
| Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |

---

**Dernière mise à jour**: 03/11/2025
**Version**: 1.2.1
