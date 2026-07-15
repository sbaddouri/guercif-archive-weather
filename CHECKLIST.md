# Checklist de Vérification Mensuelle

Vérifiez ces points **chaque mois** pour être sûr que tout fonctionne !

## 🟢 Chaque semaine (1 minute)
1. Aller sur la page d'accueil du site
2. Vérifier que le "Statut de mise à jour" est en vert (✅)
3. Vérifier que la date de la dernière mise à jour est bien à jour (moins de 4 jours de retard)

## 🟡 Chaque mois (10 minutes)
1. Aller sur GitHub → Onglet "Actions"
2. Vérifier que le workflow "Update Weather Data" a fonctionné tous les jours
3. Si un workflow a échoué, cliquez dessus pour voir les logs
4. Vérifier qu'il y a bien des données pour tous les jours du mois écoulé
5. Lancer `npm run build` pour être sûr que le site compile toujours
6. Regarder si y'a des dépendances à mettre à jour avec `npm audit` et `npm outdated`

## 🔴 Si quelque chose ne marche pas
1. Ne paniquez pas !
2. Lisez le fichier WORKFLOW_GUIDE.md
3. Vérifiez le fichier data/last-update-status.json
4. Si vous bloquez, demandez de l'aide à quelqu'un qui sait coder !
