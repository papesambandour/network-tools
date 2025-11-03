================================================================================
              NETWORK TOOLS v1.3.1 - Package d'installation
                  Pour Linux (avec ou sans compilateur)
================================================================================

📦 CONTENU DE CE PACKAGE:

  ✅ papesambandour-network-tools-1.3.1.tgz  - Package npm principal
  ✅ install.sh                              - Script d'installation automatique
  ✅ LISEZMOI.txt                            - Installation rapide
  ✅ INSTALL_LINUX.txt                       - Guide complet
  ✅ README_INSTALL.txt                      - Ce fichier

================================================================================
                    🚀 INSTALLATION EN 3 ÉTAPES
================================================================================

1️⃣  RENDRE LE SCRIPT EXÉCUTABLE:
    chmod +x install.sh

2️⃣  LANCER L'INSTALLATION:
    ./install.sh papesambandour-network-tools-1.3.1.tgz

3️⃣  VÉRIFIER:
    network-tools --version
    network-tools

    Puis ouvrir: http://localhost:3001

================================================================================
                  ⚡ INSTALLATION RAPIDE ALTERNATIVE
================================================================================

Sans script (si vous savez ce que vous faites):

    npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts

⚠️  Le flag --ignore-scripts est ESSENTIEL si vous n'avez pas de compilateur !

================================================================================
                        📚 DOCUMENTATION
================================================================================

- LISEZMOI.txt         → Installation rapide (2 minutes)
- INSTALL_LINUX.txt    → Guide complet avec toutes les méthodes
- INSTALLATION.md      → Dans le .tgz, guide très détaillé

Pour extraire INSTALLATION.md:
    tar -xzf papesambandour-network-tools-1.3.1.tgz \
        --strip-components=1 package/INSTALLATION.md

================================================================================
                    🔧 RÉSOLUTION DES PROBLÈMES
================================================================================

ERREUR: "Unable to detect compiler type"
➜ C'est normal ! Ajoutez --ignore-scripts:
  npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts

ERREUR: "Command not found: network-tools"
➜ Ajoutez npm au PATH:
  export PATH="$(npm config get prefix)/bin:$PATH"

ERREUR: "EACCES: permission denied"
➜ Utilisez sudo:
  sudo npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts

ERREUR: "Port already in use"
➜ Changez le port:
  PORT=8080 network-tools

================================================================================
                    📋 MÉTHODES D'INSTALLATION
================================================================================

Le script install.sh essaie automatiquement dans cet ordre:

  1. Installation avec --ignore-scripts (sans compilateur)
  2. Installation avec --force (tente de forcer)
  3. Installation manuelle (extraction et copie manuelle)

Vous pouvez aussi utiliser directement npm:

  # Sans compilateur (fonctionne partout):
  npm install -g *.tgz --ignore-scripts

  # Avec compilateur (performances optimales):
  sudo apt-get install -y build-essential python3
  npm install -g *.tgz

  # Installation locale (sans sudo):
  Voir INSTALL_LINUX.txt, section "Méthode 4"

================================================================================
                    ✨ FONCTIONNALITÉS
================================================================================

✅ SSH Tunnel Manager       - Créer et gérer des tunnels SSH
✅ SSL Certificate Manager  - Générer des certificats SSL self-signed
✅ SSL Server Profiles      - Sauvegarder des profils de serveurs
✅ Reverse Proxy Manager    - Proxy dynamique vers backends
✅ SSH Terminal             - Terminal SSH dans le navigateur
✅ Real-time Logs           - Logs en temps réel (WebSocket)
✅ Modern Web Interface     - Interface React moderne

================================================================================
                    🌐 APRÈS L'INSTALLATION
================================================================================

1. Démarrer l'application:
   network-tools

2. Accéder à l'interface:
   http://localhost:3001

3. Commencer à créer:
   - Des tunnels SSH
   - Des routes de reverse proxy
   - Des certificats SSL

4. Arrêter l'application:
   Ctrl+C

================================================================================
                    ⚙️  CONFIGURATION (OPTIONNELLE)
================================================================================

Variables d'environnement:

  PORT=8080 network-tools              # Changer le port
  SSH_KEY_PATH=~/.ssh/my_key network-tools  # Clé SSH par défaut

Créer un fichier .env:
  PORT=3001
  CLIENT_URL=http://localhost:3000
  SSH_KEY_PATH=~/.ssh/id_rsa

================================================================================
                    📞 SUPPORT
================================================================================

GitHub: https://github.com/papesambandour/network-tools
Email: papesambandour@example.com

Logs npm:
  cat ~/.npm/_logs/*-debug-*.log | tail -50

Informations système:
  node --version    # Requis: 14.x ou supérieur
  npm --version
  uname -a

================================================================================
                    🔐 SÉCURITÉ
================================================================================

⚠️  IMPORTANT:
  - N'utilisez PAS les certificats self-signed en production
  - Gardez vos clés SSH privées sécurisées (chmod 600)
  - Ne committez jamais de mots de passe dans Git
  - Utilisez SSH keys au lieu de mots de passe quand possible

================================================================================
                    📊 INFORMATIONS TECHNIQUES
================================================================================

- Langage: Node.js (Backend) + React (Frontend)
- Port par défaut: 3001
- Base de données: NeDB (embedded, NoSQL)
- WebSocket: Pour les logs en temps réel
- SSH: Module ssh2
- SSL: Module node-forge

Modules natifs (optionnels):
- cpu-features: Optimise les performances SSH
  → Sans compilateur: L'app fonctionne quand même !

================================================================================

Version: 1.3.1
Date: 03/11/2025
Auteur: Pape Samba Ndour
License: MIT

================================================================================
                    🎉 BONNE INSTALLATION !
================================================================================
