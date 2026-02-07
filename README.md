# Simward

Application web moderne construite avec React et déployée sur GitHub Pages.

## Stack Technique

- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server
- **TailwindCSS** - Framework CSS utility-first
- **Shadcn UI** - Composants UI réutilisables
- **Recharts** - Bibliothèque de graphiques
- **Biome** - Linter et formatter rapide
- **Turbo** - Système de build haute performance
- **pnpm** - Gestionnaire de paquets (géré via asdf)

## Prérequis

Ce projet utilise **asdf** pour gérer les versions des outils. Les versions sont définies dans `.tool-versions`.

**Versions utilisées :**
- Node.js : dernière version stable (LTS)
- pnpm : 9.15.2

```bash
# Installer asdf (si pas déjà fait)
brew install asdf  # macOS

# Installer les plugins
asdf plugin add nodejs
asdf plugin add pnpm

# Installer les versions
asdf install
```

## Installation

```bash
pnpm install
```

## Développement

```bash
pnpm dev
```

L'application sera disponible sur `http://localhost:5173`

## Build

```bash
pnpm build
```

Le build sera généré dans le dossier `dist/`

## Linting et Formatage

```bash
# Vérifier le code
pnpm lint

# Corriger automatiquement
pnpm lint:fix

# Formatter le code
pnpm format
```

## Déploiement

L'application est automatiquement déployée sur GitHub Pages lors d'un push sur la branche `main`.

Le site est accessible à l'adresse: `https://[votre-username].github.io/simward/`

### Configuration GitHub Pages

1. Allez dans les paramètres de votre dépôt GitHub
2. Section "Pages" dans le menu latéral
3. Source: "GitHub Actions"

Le workflow GitHub Actions se chargera automatiquement du déploiement.

## Structure du Projet

```
simward/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Workflow de déploiement
├── src/
│   ├── components/
│   │   ├── ui/            # Composants Shadcn UI
│   │   └── example-chart.tsx
│   ├── lib/
│   │   └── utils.ts       # Utilitaires
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── biome.json
├── turbo.json
└── package.json
```

## License

MIT
