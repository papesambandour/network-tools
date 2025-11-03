# Guide d'installation - Network Tools

Ce guide vous aide à installer Network Tools sur votre machine Linux, même sans compilateur C/C++.

## 🚀 Méthodes d'installation

### Méthode 1 : Script d'installation automatique (Recommandé)

Le script d'installation essaie plusieurs méthodes automatiquement :

```bash
# 1. Rendre le script exécutable
chmod +x install.sh

# 2. Lancer l'installation
./install.sh papesambandour-network-tools-1.3.1.tgz

# Ou simplement (détecte automatiquement le .tgz)
./install.sh
```

Le script va :
1. Essayer l'installation avec `--ignore-scripts`
2. Si échec, essayer avec `--force`
3. Si échec, faire une installation manuelle

### Méthode 2 : Installation npm standard avec compilateur

Si vous avez accès sudo et pouvez installer les outils de compilation :

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential python3

# RedHat/CentOS/Fedora
sudo yum groupinstall "Development Tools"
sudo yum install python3

# Puis installer
npm install -g papesambandour-network-tools-1.3.1.tgz
```

### Méthode 3 : Installation sans scripts (rapide)

Si vous n'avez pas besoin des optimisations natives :

```bash
npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts
```

⚠️ **Note** : Cette méthode ignore les scripts de compilation, ce qui peut affecter légèrement les performances SSH, mais l'application fonctionnera normalement.

### Méthode 4 : Installation locale (sans sudo)

Si vous n'avez pas les droits sudo :

```bash
# 1. Créer un répertoire pour les binaires
mkdir -p ~/.local/bin

# 2. Extraire le package
mkdir -p ~/network-tools-install
tar -xzf papesambandour-network-tools-1.3.1.tgz -C ~/network-tools-install
cd ~/network-tools-install/package

# 3. Installer les dépendances (ignore les erreurs natives)
npm install --production --ignore-scripts --no-optional

# 4. Créer un lien symbolique
ln -s "$(pwd)/bin/network-tools.js" ~/.local/bin/network-tools
chmod +x bin/network-tools.js

# 5. Ajouter au PATH (ajouter dans ~/.bashrc ou ~/.zshrc)
export PATH="$HOME/.local/bin:$PATH"

# 6. Recharger le shell
source ~/.bashrc  # ou source ~/.zshrc
```

## ✅ Vérification de l'installation

```bash
# Vérifier la version
network-tools --version

# Démarrer l'application
network-tools
```

L'application devrait démarrer sur : **http://localhost:3001**

## 🐛 Résolution des problèmes

### Erreur : "Unable to detect compiler type"

**Cause** : Le module `cpu-features` (dépendance de `ssh2`) nécessite un compilateur.

**Solutions** :

1. **Installer les outils de compilation** (recommandé) :
   ```bash
   sudo apt-get install -y build-essential python3
   npm install -g papesambandour-network-tools-1.3.1.tgz
   ```

2. **Utiliser le script d'installation** :
   ```bash
   ./install.sh papesambandour-network-tools-1.3.1.tgz
   ```

3. **Installation sans scripts** :
   ```bash
   npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts
   ```

### Erreur : "Command not found: network-tools"

**Cause** : Le répertoire des binaires npm n'est pas dans le PATH.

**Solution** :

```bash
# Trouver le répertoire npm global
NPM_BIN=$(npm config get prefix)/bin

# Ajouter au PATH (temporaire)
export PATH="$NPM_BIN:$PATH"

# Ajouter au PATH (permanent - ajouter dans ~/.bashrc)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Erreur : "EACCES: permission denied"

**Cause** : Droits insuffisants pour l'installation globale.

**Solutions** :

1. **Utiliser sudo** :
   ```bash
   sudo npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts
   ```

2. **Installation locale** (voir Méthode 4 ci-dessus)

3. **Configurer npm pour un répertoire local** :
   ```bash
   mkdir -p ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   # Puis installer
   npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts
   ```

### L'application démarre mais ne répond pas

**Vérifications** :

```bash
# Vérifier si le port 3001 est déjà utilisé
lsof -i :3001

# Si occupé, tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
PORT=8080 network-tools
```

## 📦 Structure du package

Le package contient :
- **Backend** : Serveur Node.js/Express (port 3001)
- **Frontend** : Application React pré-compilée
- **CLI** : Commande `network-tools` pour démarrer l'application

## 🔄 Mise à jour

```bash
# Désinstaller l'ancienne version
npm uninstall -g @papesambandour/network-tools

# Installer la nouvelle version
npm install -g papesambandour-network-tools-1.3.1.tgz --ignore-scripts
```

## 🆘 Support

Si aucune méthode ne fonctionne :

1. **Vérifier les logs** :
   ```bash
   cat ~/.npm/_logs/*-debug-*.log | tail -50
   ```

2. **Informations système** :
   ```bash
   node --version
   npm --version
   uname -a
   ```

3. **Dernière solution** : Exécuter directement depuis le répertoire source :
   ```bash
   # Extraire le package
   tar -xzf papesambandour-network-tools-1.3.1.tgz
   cd package

   # Installer les dépendances
   npm install --ignore-scripts --no-optional

   # Démarrer
   node server/index.js
   ```

## 📝 Notes importantes

- **cpu-features** : Module natif optionnel pour optimiser les performances SSH
- **Sans compilateur** : L'application fonctionne normalement, mais les performances SSH peuvent être légèrement réduites
- **Port par défaut** : 3001 (configurable via variable d'environnement `PORT`)
- **Node.js requis** : Version 14.x ou supérieure

## ✨ Après l'installation

```bash
# Démarrer l'application
network-tools

# Ouvrir dans le navigateur
# http://localhost:3001

# Arrêter l'application
# Ctrl+C
```

---

**Version** : 1.3.1
**Date** : 03/11/2025
