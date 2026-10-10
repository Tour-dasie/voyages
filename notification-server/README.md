# Envoi des rappels lorsque le site est fermé

Service prêt à déployer, **pas encore déployé**. Le service worker ne constitue pas un serveur d’envoi.

Prérequis : accès administrateur au projet Firebase `tour-dasie`, plan compatible avec les fonctions planifiées et la facturation, et clé privée VAPID correspondant à la clé publique déjà utilisée sur le site. La conserver uniquement dans Secret Manager ; ne jamais la committer. Retrouver l’ancien expéditeur avant de déployer pour éviter deux services envoyant les mêmes notifications. Si la paire VAPID est remplacée, tous les appareils doivent se réinscrire.

Depuis ce répertoire, avec Firebase CLI et Node 22 :

```
cd functions
npm ci
npm test
cd ..
firebase login
firebase functions:secrets:set WEB_PUSH_VAPID_PRIVATE --project tour-dasie
firebase deploy --only functions:trip-notifications --project tour-dasie
```

L’authentification du carnet ne donne pas ces droits administrateur. Ne pas activer de nouvelle facturation sans décision du propriétaire.

## Comportement

- Exécution toutes les 15 minutes. Une notification distincte par tâche due non cochée ; pas de groupe résumé.
- Date de préparation conservée. Matin 8 h, dépenses 20 h, préparation du soir 21 h, autres tâches 9 h ; fuseau du pays prévu dans l’itinéraire par défaut. Une date/heure du billet reste prioritaire sur ces repères.
- Pas de rattrapage automatique de tous les anciens rappels, ni d’envoi après 23 h. Les tâches restent visibles dans le carnet. Si la routine exacte doit changer, ajuster `notificationHour` ou le fuseau sur l’appareil.
- Journal par appareil/tâche : empêche les réenvois ordinaires. Bail de 2 minutes pour exécutions concurrentes ; un crash après acceptation du push mais avant l’écriture du journal peut exceptionnellement provoquer un doublon, avec la même balise visuelle.
- Vérification des cases avant chaque envoi ; inscriptions expirées 404/410 désactivées. Les cases partagées concernent les deux voyageurs ; les rappels des sacs personnels sont limités au propriétaire de l’appareil.
- 20 messages maximum par appareil et exécution, les suivants au passage suivant. Réseau nécessaire sur le téléphone pour réception. Accepter un push côté fournisseur ne garantit pas son affichage : réglages du téléphone, concentration, réseau et batterie peuvent retarder la réception.
- Le bouton Test demande un véritable envoi serveur, distinct de la notification locale qui confirme l’inscription. L’état `notificationService` ne devient actif qu’après un passage du serveur.

Le serveur utilise `voyages/asie/notificationSettings`, `voyages/asie/content`, `voyages/asie/data/blob`, `push` et `notificationDelivery/asie`. Les règles de base doivent réserver l’administration de `notificationService`/`notificationDelivery` au serveur et autoriser chaque utilisateur uniquement pour ses appareils ; vérifier les règles existantes avant déploiement. Les journaux ne contiennent ni clé VAPID privée ni URL d’abonnement.

Documentation : https://firebase.google.com/docs/functions/schedule-functions ; https://firebase.google.com/docs/functions/config-env ; https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
