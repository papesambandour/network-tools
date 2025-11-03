#!/bin/bash

# Script de test pour le module Reverse Proxy
# Ce script permet de tester rapidement les fonctionnalités

echo "=========================================="
echo "  Test du Module Reverse Proxy"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"
API_URL="${BASE_URL}/api/reverse-proxy"

echo -e "${BLUE}Base URL:${NC} $BASE_URL"
echo -e "${BLUE}API URL:${NC} $API_URL"
echo ""

# Test 1: Vérifier que le serveur est démarré
echo -e "${YELLOW}Test 1: Vérification du serveur${NC}"
if curl -s "${BASE_URL}/api/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} Serveur démarré"
else
    echo -e "${RED}✗${NC} Serveur non démarré. Lancer 'npm run dev' d'abord"
    exit 1
fi
echo ""

# Test 2: Lister les routes existantes
echo -e "${YELLOW}Test 2: Liste des routes${NC}"
ROUTES=$(curl -s "${API_URL}/routes")
ROUTE_COUNT=$(echo $ROUTES | jq -r '.routes | length' 2>/dev/null || echo "0")
echo -e "Nombre de routes: ${BLUE}${ROUTE_COUNT}${NC}"
if [ "$ROUTE_COUNT" != "0" ]; then
    echo "$ROUTES" | jq -r '.routes[] | "  - \(.path) → \(.target)"' 2>/dev/null
fi
echo ""

# Test 3: Créer une route de test
echo -e "${YELLOW}Test 3: Création d'une route de test${NC}"
TEST_ROUTE=$(cat <<EOF
{
  "path": "/test-api",
  "target": "https://jsonplaceholder.typicode.com",
  "type": "api",
  "description": "Route de test vers JSONPlaceholder",
  "enabled": true
}
EOF
)

CREATE_RESULT=$(curl -s -X POST "${API_URL}/routes" \
  -H "Content-Type: application/json" \
  -d "$TEST_ROUTE")

if echo "$CREATE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    ROUTE_ID=$(echo "$CREATE_RESULT" | jq -r '.route._id')
    echo -e "${GREEN}✓${NC} Route créée avec succès (ID: $ROUTE_ID)"
    INTERNAL_URL="${BASE_URL}/test-api"
    echo -e "   ${BLUE}Internal URL:${NC} $INTERNAL_URL"
else
    ERROR_MSG=$(echo "$CREATE_RESULT" | jq -r '.error' 2>/dev/null || echo "Erreur inconnue")
    echo -e "${RED}✗${NC} Échec: $ERROR_MSG"
fi
echo ""

# Test 4: Tester la route créée
echo -e "${YELLOW}Test 4: Test de la route créée${NC}"
if [ ! -z "$ROUTE_ID" ]; then
    echo "Requête: GET ${INTERNAL_URL}/posts/1"
    RESPONSE=$(curl -s "${INTERNAL_URL}/posts/1")
    if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        TITLE=$(echo "$RESPONSE" | jq -r '.title')
        echo -e "${GREEN}✓${NC} Route fonctionnelle!"
        echo -e "   Titre: ${BLUE}${TITLE}${NC}"
    else
        echo -e "${RED}✗${NC} La route ne fonctionne pas correctement"
    fi
else
    echo -e "${YELLOW}⊘${NC} Route non créée, test ignoré"
fi
echo ""

# Test 5: Récupérer les statistiques
echo -e "${YELLOW}Test 5: Statistiques${NC}"
STATS=$(curl -s "${API_URL}/stats")
if echo "$STATS" | jq -e '.success' > /dev/null 2>&1; then
    TOTAL=$(echo "$STATS" | jq -r '.stats.total')
    ENABLED=$(echo "$STATS" | jq -r '.stats.enabled')
    API_COUNT=$(echo "$STATS" | jq -r '.stats.byType.api')
    STREAM_COUNT=$(echo "$STATS" | jq -r '.stats.byType.stream')

    echo -e "  Total: ${BLUE}${TOTAL}${NC}"
    echo -e "  Actives: ${GREEN}${ENABLED}${NC}"
    echo -e "  API: ${BLUE}${API_COUNT}${NC}"
    echo -e "  Stream: ${BLUE}${STREAM_COUNT}${NC}"
else
    echo -e "${RED}✗${NC} Impossible de récupérer les statistiques"
fi
echo ""

# Test 6: Désactiver la route de test
if [ ! -z "$ROUTE_ID" ]; then
    echo -e "${YELLOW}Test 6: Désactivation de la route${NC}"
    TOGGLE_RESULT=$(curl -s -X PATCH "${API_URL}/routes/${ROUTE_ID}/toggle" \
      -H "Content-Type: application/json" \
      -d '{"enabled": false}')

    if echo "$TOGGLE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Route désactivée"
    else
        echo -e "${RED}✗${NC} Échec de la désactivation"
    fi
    echo ""
fi

# Test 7: Réactiver la route de test
if [ ! -z "$ROUTE_ID" ]; then
    echo -e "${YELLOW}Test 7: Réactivation de la route${NC}"
    TOGGLE_RESULT=$(curl -s -X PATCH "${API_URL}/routes/${ROUTE_ID}/toggle" \
      -H "Content-Type: application/json" \
      -d '{"enabled": true}')

    if echo "$TOGGLE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Route réactivée"
    else
        echo -e "${RED}✗${NC} Échec de la réactivation"
    fi
    echo ""
fi

# Test 8: Supprimer la route de test
if [ ! -z "$ROUTE_ID" ]; then
    echo -e "${YELLOW}Test 8: Nettoyage (suppression de la route de test)${NC}"
    DELETE_RESULT=$(curl -s -X DELETE "${API_URL}/routes/${ROUTE_ID}")

    if echo "$DELETE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Route supprimée"
    else
        echo -e "${RED}✗${NC} Échec de la suppression"
    fi
    echo ""
fi

echo "=========================================="
echo -e "${GREEN}Tests terminés!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Pour utiliser l'interface graphique:${NC}"
echo "  → http://localhost:3000"
echo ""
echo -e "${BLUE}Pour créer une route manuellement:${NC}"
echo "  curl -X POST ${API_URL}/routes \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{"
echo '      "path": "/mon-api",'
echo '      "target": "http://backend.example.com",'
echo '      "type": "api"'
echo "    }'"
echo ""
