# Kit GitHub JSON + Netlify pour ton planning

## 1. Où mettre les fichiers
- `events.json` : à la racine du repo de ton site
- `update-event.js` : `netlify/functions/update-event.js`
- `create-event.js` : `netlify/functions/create-event.js`
- `delete-event.js` : `netlify/functions/delete-event.js`

## 2. Variables d'environnement Netlify
Dans Netlify > Site configuration > Environment variables :

- `GITHUB_TOKEN` = token GitHub avec accès en écriture au repo
- `GITHUB_OWNER` = ton username ou org GitHub
- `GITHUB_REPO` = nom du repo
- `GITHUB_BRANCH` = `main`
- `GITHUB_FILE_PATH` = `events.json`
- `ADMIN_KEY` = ton mot de passe admin simple

## 3. Token GitHub
Crée un fine-grained personal access token avec accès `Contents: Read and write` sur le repo concerné.

## 4. Dans ton HTML
- garde ton UI telle quelle
- remplace `saveEdit()` et `delEv()` par les versions du fichier `html-snippet.js`
- ajoute `loadRemoteEvents()` au chargement
- garde `EVTS` et `nxtId`, ils seront remplacés par le contenu du JSON distant

## 5. Important
- le token GitHub reste uniquement dans Netlify
- la clé admin simple protège l'écriture depuis le front
- une seule personne qui édite de temps en temps = ce setup est très bien

## 6. Si tu veux être encore plus propre
Tu peux plus tard :
- ajouter un mini login admin
- ajouter un champ `updated_by`
- écrire aussi les couleurs / réglages dans un second JSON
