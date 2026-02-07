# Configuration GitHub Pages

Ce document explique comment configurer GitHub Pages pour déployer automatiquement votre application.

## Étapes de Configuration

### 1. Activer GitHub Pages

1. Allez dans les **Settings** de votre dépôt GitHub
2. Dans le menu latéral, cliquez sur **Pages**
3. Dans la section **Source**, sélectionnez **GitHub Actions**

### 2. Vérifier le Workflow

Le workflow de déploiement se trouve dans `.github/workflows/deploy.yml`. Il est déjà configuré pour :

- Se déclencher automatiquement lors d'un push sur la branche `main`
- Installer les dépendances avec pnpm
- Builder l'application
- Déployer sur GitHub Pages

### 3. Premier Déploiement

Pour déclencher le premier déploiement :

```bash
# Ajoutez vos fichiers
git add .

# Commitez vos changements
git commit -m "Initial commit: Setup React app with Vite"

# Poussez sur la branche main
git push origin main
```

### 4. Accéder à Votre Site

Une fois le déploiement terminé (vérifiez l'onglet **Actions** de votre dépôt), votre site sera accessible à :

```
https://[votre-username].github.io/simward/
```

Remplacez `[votre-username]` par votre nom d'utilisateur GitHub.

## Configuration de la Base URL

La base URL est configurée dans `vite.config.ts` :

```typescript
export default defineConfig({
  // ...
  base: '/simward/',
})
```

Si vous changez le nom de votre dépôt, n'oubliez pas de mettre à jour cette valeur.

## Permissions Requises

Le workflow nécessite les permissions suivantes (déjà configurées dans le fichier workflow) :

- `contents: read` - Pour lire le code du dépôt
- `pages: write` - Pour écrire sur GitHub Pages
- `id-token: write` - Pour l'authentification

## Vérification du Déploiement

Après chaque push sur `main` :

1. Allez dans l'onglet **Actions** de votre dépôt
2. Vérifiez que le workflow "Deploy to GitHub Pages" s'exécute
3. Une fois terminé avec succès ✅, votre site est mis à jour

## Débogage

Si le déploiement échoue :

1. Consultez les logs dans l'onglet **Actions**
2. Vérifiez que GitHub Pages est bien activé dans les Settings
3. Assurez-vous que les permissions sont correctement configurées

## Développement Local

Pour tester localement avec la même base URL que la production :

```bash
pnpm build
pnpm preview
```

Le site sera accessible à `http://localhost:4173/simward/`
