# Exemple d'affichage - Reverse Proxy Manager

## Carte de route (Route Card)

Voici comment une route s'affiche dans l'interface:

```
┌─────────────────────────────────────────────────────────────────────┐
│  [API]  /api-auth                                    [⚡] [✎] [🗑]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Internal URL:                                                       │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ http://localhost:3001/api-auth                    [📋] │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                      │
│  Backend Target:                                                     │
│  http://ws.pfi.colis.intra.laposte.fr                              │
│                                                                      │
│  Proxy Server:                                                       │
│  http://10.34.78.16:3128                                           │
│                                                                      │
│  Description:                                                        │
│  API d'authentification via proxy interne                          │
│                                                                      │
│  Headers:                                                            │
│  [User-Agent: curl/7.68.0]                                         │
│                                                                      │
│  Créée le: 03/11/2025 10:30:15                                     │
│  Modifiée le: 03/11/2025 11:45:22                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Légende

- **[API]** ou **[STREAM]** : Type de route
- **⚡** : Bouton pour activer/désactiver la route
- **✎** : Bouton pour modifier la route
- **🗑** : Bouton pour supprimer la route
- **[📋]** : Bouton pour copier l'URL interne dans le presse-papiers

## Flux de la requête

Quand un client accède à `http://localhost:3001/api-auth/login`:

```
┌─────────┐       ┌──────────────────┐       ┌────────────┐       ┌─────────────┐
│ Client  │──────>│ Reverse Proxy    │──────>│   Proxy    │──────>│  Backend    │
│         │       │ localhost:3001   │       │ 10.34.78.16│       │ ws.pfi...   │
└─────────┘       └──────────────────┘       └────────────┘       └─────────────┘
                         │                          │                     │
                         │  Path: /api-auth         │                     │
                         │  Headers: User-Agent     │                     │
                         │                          │                     │
                         └──────────────────────────┴─────────────────────┘
```

## Exemple complet avec les trois affichages

### Route 1: API avec Proxy
```
Internal URL:    http://localhost:3001/api-auth          [Copier]
                 ↓ (accessible depuis n'importe quel client)
Backend Target:  http://ws.pfi.colis.intra.laposte.fr
                 ↓ (via)
Proxy Server:    http://10.34.78.16:3128
```

### Route 2: Stream sans Proxy
```
Internal URL:    http://localhost:3001/glpi              [Copier]
                 ↓ (accès direct)
Backend Target:  https://glpi-preprod.alturing.eu
```

### Route 3: API vers GitHub
```
Internal URL:    http://localhost:3001/github-api        [Copier]
                 ↓ (avec authentification)
Backend Target:  https://api.github.com
                 ↓ (via)
Proxy Server:    http://corporate-proxy:8080
Headers:         Authorization: token ghp_xxxxx
```

**Important**: L'Internal URL affichée est celle du **serveur backend** (port 3001),
pas celle du client React (port 3000). C'est cette URL que vous devez utiliser pour
accéder à vos routes proxy depuis Postman, curl, ou tout autre client HTTP.

## Statistiques en temps réel

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│    Total     │   Actives    │  Désactivées │     API      │    Stream    │
│      5       │      4       │      1       │      3       │      2       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

## Workflow de création de route

1. **Cliquer sur "Nouvelle Route"**
2. **Remplir le formulaire**:
   - Path: `/mon-api`
   - Target: `http://backend.example.com`
   - Type: `API` ou `Stream`
   - Proxy (optionnel): `http://proxy:3128`
   - Headers (optionnel): Ajouter des headers personnalisés

3. **Tester la connexion** (bouton "Tester")
   - ✓ Connexion réussie (Status: 200)
   - ✗ Échec: Connection timeout

4. **Créer la route**
   - La route apparaît dans la liste
   - L'URL interne est immédiatement disponible
   - Un clic sur le bouton de copie permet de copier l'URL

## Gestion des routes

### Activer/Désactiver
- Bouton ⚡ : Change l'état de la route
- Route désactivée : Affichage grisé avec badge "Désactivée"
- Route active : Bordure verte, pleinement fonctionnelle

### Modifier
- Bouton ✎ : Ouvre le formulaire pré-rempli
- Tous les champs sont modifiables
- Les changements sont appliqués immédiatement

### Supprimer
- Bouton 🗑 : Demande confirmation
- Suppression définitive de la base de données
- Les requêtes vers cette route retourneront 404

## Bonnes pratiques

1. **Nommage des routes**:
   - Utilisez des noms clairs: `/api-auth`, `/files`, `/github-api`
   - Évitez les conflits: Ne pas créer `/api` et `/api-auth` simultanément

2. **Type de route**:
   - **API** : Pour les APIs REST classiques (GET, POST, PUT, DELETE)
   - **Stream** : Pour les fichiers, streaming, WebSocket, SSE

3. **Headers**:
   - Ajoutez les headers nécessaires pour l'authentification
   - User-Agent personnalisé si le backend le requiert
   - Authorization pour les APIs sécurisées

4. **Proxy**:
   - Laissez vide si accès direct au backend
   - Utilisez le proxy d'entreprise si nécessaire
   - Format: `http://host:port`

5. **Test avant création**:
   - Toujours tester la connectivité
   - Vérifier que le backend est accessible
   - Vérifier que le proxy (si utilisé) fonctionne
