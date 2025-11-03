#!/bin/bash

# Script d'installation pour network-tools
# Ce script installe le package en ignorant les erreurs de compilation optionnelles

set -e

echo "🚀 Installation de Network Tools..."
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Détecter le fichier .tgz
TGZ_FILE=""
if [ -n "$1" ]; then
    TGZ_FILE="$1"
else
    # Chercher le fichier .tgz dans le répertoire courant
    TGZ_FILE=$(ls -t papesambandour-network-tools-*.tgz 2>/dev/null | head -1)
fi

if [ -z "$TGZ_FILE" ]; then
    error "Aucun fichier .tgz trouvé. Veuillez spécifier le chemin du fichier."
    echo "Usage: $0 [chemin/vers/fichier.tgz]"
    exit 1
fi

if [ ! -f "$TGZ_FILE" ]; then
    error "Fichier non trouvé: $TGZ_FILE"
    exit 1
fi

info "Fichier trouvé: $TGZ_FILE"
echo ""

# Vérifier si build-essential est installé
if ! command -v gcc &> /dev/null; then
    warn "GCC n'est pas installé. Les dépendances natives seront ignorées."
    warn "Pour installer les outils de compilation (optionnel):"
    echo "  sudo apt-get install -y build-essential python3  # Ubuntu/Debian"
    echo "  sudo yum groupinstall 'Development Tools'        # RedHat/CentOS"
    echo ""
fi

# Option 1: Installation avec ignore-scripts
info "Tentative d'installation avec --ignore-scripts..."
if npm install -g "$TGZ_FILE" --ignore-scripts 2>/dev/null; then
    info "Installation réussie avec --ignore-scripts !"
    echo ""
    info "Network Tools a été installé avec succès."
    info "Version: $(network-tools --version 2>/dev/null || echo 'Erreur de détection')"
    echo ""
    info "Pour démarrer: network-tools"
    exit 0
fi

warn "Installation avec --ignore-scripts a échoué."
echo ""

# Option 2: Installation avec --force
info "Tentative d'installation avec --force..."
if npm install -g "$TGZ_FILE" --force 2>&1 | tee /tmp/npm-install.log; then
    if network-tools --version &> /dev/null; then
        info "Installation réussie avec --force !"
        echo ""
        info "Network Tools a été installé avec succès."
        info "Version: $(network-tools --version)"
        echo ""
        info "Pour démarrer: network-tools"
        exit 0
    fi
fi

warn "Installation avec --force a échoué."
echo ""

# Option 3: Installation manuelle
info "Tentative d'installation manuelle..."
echo ""

# Créer un répertoire temporaire
TEMP_DIR=$(mktemp -d)
info "Extraction dans: $TEMP_DIR"

# Extraire le .tgz
tar -xzf "$TGZ_FILE" -C "$TEMP_DIR"

# Trouver le dossier package
PACKAGE_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "package" | head -1)

if [ -z "$PACKAGE_DIR" ]; then
    error "Impossible de trouver le dossier package dans l'archive"
    rm -rf "$TEMP_DIR"
    exit 1
fi

info "Installation manuelle depuis: $PACKAGE_DIR"

# Installer sans exécuter les scripts
cd "$PACKAGE_DIR"
npm install --production --ignore-scripts --no-optional 2>&1 | grep -v "WARN" || true

# Copier vers le répertoire global npm
NPM_PREFIX=$(npm config get prefix)
TARGET_DIR="$NPM_PREFIX/lib/node_modules/@papesambandour/network-tools"

info "Copie vers: $TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"
sudo cp -r * "$TARGET_DIR/"

# Créer le lien symbolique
info "Création du lien symbolique..."
sudo ln -sf "$TARGET_DIR/bin/network-tools.js" "$NPM_PREFIX/bin/network-tools"
sudo chmod +x "$TARGET_DIR/bin/network-tools.js"

# Nettoyer
rm -rf "$TEMP_DIR"

# Vérifier l'installation
echo ""
if network-tools --version &> /dev/null; then
    info "✅ Installation manuelle réussie !"
    echo ""
    info "Network Tools a été installé avec succès."
    info "Version: $(network-tools --version)"
    echo ""
    info "Pour démarrer: network-tools"
    exit 0
else
    error "❌ L'installation a échoué."
    echo ""
    error "Veuillez installer les outils de compilation:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y build-essential python3"
    echo ""
    echo "Puis réessayez l'installation:"
    echo "  npm install -g $TGZ_FILE"
    exit 1
fi
