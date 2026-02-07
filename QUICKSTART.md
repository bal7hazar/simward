# 🚀 Démarrage Rapide - Simward

Bienvenue sur votre nouveau projet React !

## ✅ Ce qui a été configuré

Votre projet est maintenant complètement configuré avec :

- ⚛️ **React 18** avec TypeScript
- ⚡ **Vite** pour un développement ultra-rapide
- 🎨 **TailwindCSS** pour le styling
- 🧩 **Shadcn UI** (composants Card et Button inclus)
- 📊 **Recharts** pour les graphiques
- 🔍 **Biome** pour le linting et formatage
- 🚄 **Turbo** pour l'optimisation des builds
- 📦 **pnpm** comme gestionnaire de paquets
- 🛠️ **asdf** pour gérer les versions des outils (.tool-versions)
- 🤖 **GitHub Actions** pour le déploiement automatique

## 🎯 Prochaines Étapes

### 0. Installer les Versions des Outils

Le projet utilise **asdf** pour gérer les versions de Node.js et pnpm.

Si vous n'avez pas encore asdf configuré, consultez **ASDF_SETUP.md** pour les instructions détaillées.

**Installation rapide :**

```bash
# Installer asdf (macOS avec Homebrew)
brew install asdf

# Ajouter les plugins
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git

# Installer les versions définies dans .tool-versions
asdf install

# Vérifier les versions
asdf current
```

### 1. Tester Localement

```bash
# Installer les dépendances (déjà fait)
pnpm install

# Lancer le serveur de développement
pnpm dev
```

Ouvrez http://localhost:5173/ dans votre navigateur.

### 2. Pousser sur GitHub

```bash
# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "feat: initial project setup with React, Vite, and TailwindCSS"

# Pousser vers GitHub
git push origin main
```

### 3. Activer GitHub Pages

1. Allez sur https://github.com/[votre-username]/simward/settings/pages
2. Dans **Source**, sélectionnez **GitHub Actions**
3. Le déploiement se fera automatiquement !

**Note importante** : Pour que le site soit accessible à la racine (`https://[username].github.io/`), renommez votre dépôt en `[username].github.io`. Sinon, le site sera accessible à `https://[username].github.io/simward/` et vous devrez modifier `base: '/'` en `base: '/simward/'` dans `vite.config.ts`.

Votre site sera accessible sur : `https://[votre-username].github.io/simward/`

## 📁 Structure du Projet

```
src/
├── components/
│   ├── ui/              # Composants Shadcn UI
│   │   ├── button.tsx   # Bouton avec variants
│   │   └── card.tsx     # Composant Card
│   ├── example-chart.tsx # Exemple de graphique
│   └── index.ts         # Exports des composants
├── lib/
│   └── utils.ts         # Utilitaires (fonction cn)
├── App.tsx              # Application principale
├── main.tsx             # Point d'entrée
└── index.css            # Styles globaux
```

## 🛠️ Commandes Utiles

```bash
# Développement
pnpm dev          # Lance le serveur de dev
pnpm build        # Build pour production
pnpm preview      # Prévisualise le build

# Qualité de code
pnpm lint         # Vérifie le code
pnpm lint:fix     # Corrige automatiquement
pnpm format       # Formate le code
```

## 🎨 Ajouter des Composants

Pour ajouter d'autres composants Shadcn UI :

```bash
# Exemple avec le composant Dialog
npx shadcn-ui@latest add dialog
```

## 📚 Documentation

- **README.md** : Documentation principale
- **ASDF_SETUP.md** : Guide détaillé pour configurer asdf
- **GITHUB_PAGES_SETUP.md** : Guide détaillé pour GitHub Pages
- **PROJECT_STRUCTURE.md** : Structure complète du projet
- **CONTRIBUTING.md** : Guide pour les contributeurs
- **CHANGELOG.md** : Historique des versions
- **QUICKSTART.md** : Ce guide de démarrage rapide

## 🎓 Ressources

- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [Biome](https://biomejs.dev/)

## 💡 Conseils

1. **Mode Sombre** : Le thème supporte déjà le dark mode via les variables CSS
2. **Alias @/** : Utilisez `@/` pour importer depuis `src/`
3. **Linting** : Le code est automatiquement formaté avec Biome
4. **Hot Reload** : Vite recharge automatiquement lors des changements

## 🐛 Problèmes ?

Si vous rencontrez des problèmes :

1. Vérifiez les versions des outils : `asdf current`
2. Réinstallez les outils : `asdf install`
3. Supprimez `node_modules` et réinstallez : `rm -rf node_modules && pnpm install`

## ✨ C'est Tout !

Votre projet est prêt à être développé. Bon coding ! 🎉
