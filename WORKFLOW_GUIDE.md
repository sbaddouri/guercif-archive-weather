# Guide du Workflow de Mise à Jour des Données Météo

## ⚠️ IMPORTANT ! NE PAS MODIFIER CES FICHIERS SANS VÉRIFICATION
- `.github/workflows/update-weather.yml` : Le workflow automatique
- `scripts/fetch-weather.ts` : Le script qui récupère les données
- `src/lib/data.ts` : Les fonctions pour lire les données
- `src/lib/weather-colors.ts` : Les calculs d'ensoleillement

## Fonctionnement du workflow
1. S'exécute **tous les jours à 2h UTC** (4h du matin en France l'hiver, 5h l'été)
2. Peut aussi être lancé manuellement depuis l'onglet "Actions" de GitHub
3. Récupère les données des 31 derniers jours
4. Commite les modifications dans le dossier `data/`
5. Met à jour le fichier `data/last-update-status.json` avec le statut

## Que faire si le workflow échoue ?
1. Allez sur l'onglet "Actions" de votre dépôt GitHub
2. Cliquez sur le workflow "Update Weather Data"
3. Voir le dernier run qui a échoué
4. Lisez les logs pour comprendre l'erreur
5. Si vous ne savez pas, contactez quelqu'un qui sait coder !
