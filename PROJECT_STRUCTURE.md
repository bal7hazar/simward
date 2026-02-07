# Structure du Projet Simward

```
simward/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions pour le déploiement automatique
├── .vscode/
│   ├── extensions.json         # Extensions VSCode recommandées
│   └── settings.json          # Configuration VSCode pour le projet
├── public/
│   └── vite.svg               # Logo Vite
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── card.tsx       # Composant Card de Shadcn UI
│   │   ├── example-chart.tsx  # Exemple de graphique avec Recharts
│   │   └── index.ts           # Exports des composants
│   ├── lib/
│   │   └── utils.ts           # Utilitaires (cn pour TailwindCSS)
│   ├── App.tsx                # Composant principal
│   ├── main.tsx               # Point d'entrée React
│   └── index.css              # Styles globaux avec Tailwind
├── .editorconfig              # Configuration des éditeurs
├── .gitignore                 # Fichiers à ignorer par Git
├── .tool-versions             # Versions des outils gérées par asdf
├── biome.json                 # Configuration Biome (linter/formatter)
├── CHANGELOG.md               # Historique des versions
├── CONTRIBUTING.md            # Guide de contribution
├── GITHUB_PAGES_SETUP.md      # Guide de configuration GitHub Pages
├── index.html                 # Template HTML
├── LICENSE                    # Licence du projet
├── package.json               # Dépendances et scripts
├── pnpm-lock.yaml             # Lockfile pnpm (versionné)
├── postcss.config.js          # Configuration PostCSS
├── PROJECT_STRUCTURE.md       # Documentation de la structure
├── QUICKSTART.md              # Guide de démarrage rapide
├── README.md                  # Documentation principale
├── tailwind.config.js         # Configuration TailwindCSS
├── tsconfig.json              # Configuration TypeScript (src)
├── tsconfig.node.json         # Configuration TypeScript (config Vite)
├── turbo.json                 # Configuration Turbo
└── vite.config.ts             # Configuration Vite

```

## Fichiers Clés

### Configuration

- **vite.config.ts** : Configure Vite avec React et le chemin de base pour GitHub Pages
- **tailwind.config.js** : Thème et configuration TailwindCSS avec variables CSS
- **biome.json** : Règles de linting et formatage (alternative à ESLint/Prettier)
- **turbo.json** : Configuration du cache et des tasks Turbo
- **tsconfig.json** : Configuration TypeScript avec alias `@/*` pour les imports
- **.tool-versions** : Versions de Node.js et pnpm gérées par asdf

### Développement

- **src/main.tsx** : Point d'entrée React, monte l'application sur le DOM
- **src/App.tsx** : Composant racine de l'application
- **src/index.css** : Variables CSS pour le thème (dark mode supporté)
- **src/lib/utils.ts** : Fonction `cn()` pour fusionner les classes Tailwind

### GitHub Pages

- **.github/workflows/deploy.yml** : Workflow qui :
  - S'exécute sur push vers `main`
  - Installe les dépendances avec pnpm
  - Build l'application
  - Déploie sur GitHub Pages

### Composants

- **src/components/ui/card.tsx** : Composant Card style Shadcn UI
- **src/components/example-chart.tsx** : Exemple d'utilisation de Recharts
- **src/components/index.ts** : Réexporte les composants pour faciliter les imports

## Scripts Disponibles

```bash
pnpm dev        # Lance le serveur de développement
pnpm build      # Build pour la production
pnpm preview    # Prévisualise le build
pnpm lint       # Vérifie le code avec Biome
pnpm lint:fix   # Corrige automatiquement les erreurs
pnpm format     # Formate le code
```

## Technologies

- **React 18** : Bibliothèque UI
- **Vite 6** : Build tool ultra-rapide
- **TypeScript** : Typage statique
- **TailwindCSS** : Framework CSS utility-first
- **Shadcn UI** : Composants UI copiés dans le projet
- **Recharts** : Bibliothèque de graphiques React
- **Biome** : Linter et formatter moderne (alternative à ESLint + Prettier)
- **Turbo** : Système de cache pour les builds
- **pnpm** : Gestionnaire de paquets rapide et efficace
- **asdf** : Gestionnaire de versions d'outils (.tool-versions)

## Variables CSS

Le projet utilise des variables CSS pour le thème, définies dans `src/index.css` :

- Mode clair et mode sombre supportés
- Variables pour les couleurs : background, foreground, primary, secondary, etc.
- Variables pour les graphiques : chart-1 à chart-5

## Alias de Chemins

Le projet est configuré avec l'alias `@` qui pointe vers `./src` :

```typescript
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
```

## Base URL

La base URL est configurée pour GitHub Pages dans `vite.config.ts` :

```typescript
base: '/simward/'
```

Si vous changez le nom du dépôt, mettez à jour cette valeur.
