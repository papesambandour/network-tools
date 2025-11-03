# Documentation Index

Index complet de la documentation du projet Network Tools.

## 📚 Documentation principale

### README.md
- **Description**: Guide de démarrage rapide
- **Contenu**: Installation, configuration, utilisation de base
- **Public**: Tous les utilisateurs
- **Lien**: [README.md](../README.md)

### ARCHITECTURE.md
- **Description**: Architecture technique détaillée
- **Contenu**: Structure du code, technologies, API, architecture
- **Public**: Développeurs et contributeurs
- **Lien**: [ARCHITECTURE.md](../ARCHITECTURE.md)

## 🔄 Module Reverse Proxy

### REVERSE_PROXY.md
- **Description**: Documentation complète du module reverse proxy
- **Contenu**:
  - Fonctionnalités du reverse proxy
  - Endpoints API REST
  - Configuration et utilisation
  - Types de routes (API vs Stream)
  - Exemples de configuration
- **Public**: Utilisateurs du module reverse proxy
- **Lien**: [REVERSE_PROXY.md](./REVERSE_PROXY.md)

### REVERSE_PROXY_USAGE.md
- **Description**: Guide d'utilisation complet
- **Contenu**:
  - Différence entre URLs (client vs backend)
  - Workflow complet de création de route
  - Utilisation avec curl, Postman, JavaScript, Python
  - Cas d'usage concrets (API interne, CORS, authentification)
  - Différences entre types API et Stream
  - Debugging et troubleshooting
- **Public**: Utilisateurs et développeurs
- **Lien**: [REVERSE_PROXY_USAGE.md](./REVERSE_PROXY_USAGE.md)

### REVERSE_PROXY_EXAMPLE.md
- **Description**: Exemples visuels et pratiques
- **Contenu**:
  - Représentation visuelle des cartes de route
  - Exemples d'affichage dans l'interface
  - Flux de requêtes illustrés
  - Workflow de création étape par étape
  - Bonnes pratiques
- **Public**: Utilisateurs visuels
- **Lien**: [REVERSE_PROXY_EXAMPLE.md](./REVERSE_PROXY_EXAMPLE.md)

### REVERSE_PROXY_SUMMARY.md
- **Description**: Résumé des modifications et implémentation
- **Contenu**:
  - Liste des fichiers créés/modifiés
  - Fonctionnalités implémentées
  - Architecture du module
  - Correction du bug de l'URL (window.location.origin)
  - Points clés techniques
  - Exemple complet d'utilisation
- **Public**: Développeurs et mainteneurs
- **Lien**: [REVERSE_PROXY_SUMMARY.md](./REVERSE_PROXY_SUMMARY.md)

### CHANGELOG_REVERSE_PROXY.md
- **Description**: Historique des changements
- **Contenu**:
  - Version 1.0.0 - Nouvelles fonctionnalités
  - Affichage des URLs amélioré
  - Bouton de copie rapide
  - Améliorations techniques
  - Composants mis à jour
  - Bénéfices utilisateur
- **Public**: Tous les utilisateurs
- **Lien**: [CHANGELOG_REVERSE_PROXY.md](./CHANGELOG_REVERSE_PROXY.md)

## 🧪 Scripts de test

### test-reverse-proxy.sh
- **Description**: Script automatisé de test du reverse proxy
- **Contenu**:
  - Test de connexion au serveur
  - Création de route de test
  - Test de la route créée
  - Statistiques
  - Activation/désactivation
  - Nettoyage
- **Public**: Développeurs et testeurs
- **Lien**: [test-reverse-proxy.sh](../test-reverse-proxy.sh)
- **Usage**: `./test-reverse-proxy.sh` (nécessite `jq`)

## 📁 Structure de la documentation

```
network-tools/
├── README.md                       # Guide de démarrage (racine)
├── ARCHITECTURE.md                 # Architecture technique (racine)
├── docs/                           # Dossier documentation
│   ├── DOCUMENTATION_INDEX.md      # Ce fichier
│   ├── REVERSE_PROXY.md            # Doc complète reverse proxy
│   ├── REVERSE_PROXY_USAGE.md      # Guide d'utilisation
│   ├── REVERSE_PROXY_EXAMPLE.md    # Exemples visuels
│   ├── REVERSE_PROXY_SUMMARY.md    # Résumé implémentation
│   ├── CHANGELOG_REVERSE_PROXY.md  # Changelog
│   ├── QUICK_START_REVERSE_PROXY.md# Quick start
│   ├── UPDATES_SUMMARY.md          # Résumé updates
│   └── COMPLETION_REPORT.md        # Rapport final
└── test-reverse-proxy.sh           # Script de test (racine)
```

## 🎯 Guide par objectif

### Je veux démarrer rapidement
→ Lire **[README.md](../README.md)**

### Je veux comprendre l'architecture
→ Lire **[ARCHITECTURE.md](../ARCHITECTURE.md)**

### Je veux utiliser le reverse proxy
→ Lire dans l'ordre:
1. **[REVERSE_PROXY.md](./REVERSE_PROXY.md)** - Comprendre les concepts
2. **[REVERSE_PROXY_USAGE.md](./REVERSE_PROXY_USAGE.md)** - Utiliser concrètement
3. **[REVERSE_PROXY_EXAMPLE.md](./REVERSE_PROXY_EXAMPLE.md)** - Voir des exemples

### Je veux développer/contribuer
→ Lire dans l'ordre:
1. **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Architecture globale
2. **[REVERSE_PROXY_SUMMARY.md](./REVERSE_PROXY_SUMMARY.md)** - Détails techniques
3. **[CHANGELOG_REVERSE_PROXY.md](./CHANGELOG_REVERSE_PROXY.md)** - Historique

### Je veux tester le reverse proxy
→ Exécuter **[test-reverse-proxy.sh](../test-reverse-proxy.sh)**

## 🔍 Recherche rapide

### Concepts clés

| Concept | Fichier | Section |
|---------|---------|---------|
| Installation | README.md | Quick Start |
| SSH Tunnels | README.md | Using the Application |
| SSL Certificates | README.md | Generating SSL Certificates |
| Reverse Proxy - Introduction | REVERSE_PROXY.md | Fonctionnalités |
| Reverse Proxy - API | REVERSE_PROXY.md | API Endpoints |
| Reverse Proxy - Types | REVERSE_PROXY_USAGE.md | Différences entre les types |
| Reverse Proxy - CORS | REVERSE_PROXY_USAGE.md | Cas 2: Contourner le CORS |
| Reverse Proxy - Copie URL | REVERSE_PROXY_SUMMARY.md | Bouton de copie rapide |
| Architecture Backend | ARCHITECTURE.md | Backend - Node.js/Express |
| Architecture Frontend | ARCHITECTURE.md | Frontend - React |
| API REST | ARCHITECTURE.md | API Documentation |
| Troubleshooting | README.md | Troubleshooting |

### Exemples de code

| Type d'exemple | Fichier | Section |
|----------------|---------|---------|
| curl | REVERSE_PROXY_USAGE.md | Étape 3: Utiliser la route |
| JavaScript fetch | REVERSE_PROXY_USAGE.md | Avec JavaScript (fetch) |
| Python requests | REVERSE_PROXY_USAGE.md | Avec Python (requests) |
| Configuration route | REVERSE_PROXY_EXAMPLE.md | Exemple complet |
| Test automatisé | test-reverse-proxy.sh | - |

## 📊 Métriques de documentation

- **Total de fichiers**: 9 fichiers
- **Documentation principale**: 2 fichiers
- **Module Reverse Proxy**: 5 fichiers
- **Scripts**: 1 fichier
- **Index**: 1 fichier (ce fichier)

## 🔄 Mises à jour

Pour maintenir la documentation à jour:

1. **Nouvelle fonctionnalité**: Créer un fichier MD dédié
2. **Modification**: Mettre à jour le fichier correspondant
3. **Changelog**: Ajouter l'entrée dans le changelog approprié
4. **Index**: Mettre à jour ce fichier (DOCUMENTATION_INDEX.md)

## 📝 Convention de nommage

- `README.md` - Documentation générale
- `ARCHITECTURE.md` - Architecture et structure
- `[MODULE]_[TYPE].md` - Documentation spécifique à un module
- `CHANGELOG_[MODULE].md` - Historique des changements
- `DOCUMENTATION_INDEX.md` - Index de toute la documentation

Où `[TYPE]` peut être:
- (vide) - Documentation principale
- `USAGE` - Guide d'utilisation
- `EXAMPLE` - Exemples
- `SUMMARY` - Résumé
- `API` - Documentation API

## ✨ Contribution

Pour contribuer à la documentation:

1. Identifier le fichier approprié (ou créer un nouveau)
2. Suivre la structure existante
3. Ajouter des exemples concrets
4. Mettre à jour cet index si nécessaire
5. Créer une entrée dans le changelog

## 🎓 Ressources d'apprentissage

### Pour les débutants
1. **[README.md](../README.md)** - Commencer ici
2. **[REVERSE_PROXY_EXAMPLE.md](./REVERSE_PROXY_EXAMPLE.md)** - Voir des exemples visuels

### Pour les utilisateurs intermédiaires
1. **[REVERSE_PROXY_USAGE.md](./REVERSE_PROXY_USAGE.md)** - Cas d'usage avancés
2. **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Comprendre l'architecture

### Pour les développeurs
1. **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Architecture complète
2. **[REVERSE_PROXY_SUMMARY.md](./REVERSE_PROXY_SUMMARY.md)** - Détails d'implémentation

---

**Dernière mise à jour**: 2025-11-03
**Version**: 1.2.1
