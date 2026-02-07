# Guide de Contribution

Merci de votre intérêt pour contribuer à Simward !

## Prérequis

- **asdf** pour gérer les versions des outils
- Node.js 20+ et pnpm 9+ (gérés via asdf)

### Installation avec asdf

Si vous n'avez pas encore asdf installé :

```bash
# Installation d'asdf (macOS avec Homebrew)
brew install asdf

# Ou suivez les instructions sur https://asdf-vm.com/guide/getting-started.html
```

Installez les plugins nécessaires :

```bash
# Plugin Node.js
asdf plugin add nodejs

# Plugin pnpm
asdf plugin add pnpm
```

Les versions seront automatiquement installées via le fichier `.tool-versions` :

```bash
asdf install
```

## Installation

1. Forkez le dépôt
2. Clonez votre fork :

```bash
git clone https://github.com/[votre-username]/simward.git
cd simward
```

3. Installez les dépendances :

```bash
pnpm install
```

## Développement

### Lancer le serveur de développement

```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:5173/simward/`

### Vérifier le code

Avant de soumettre vos modifications, assurez-vous que le code passe les vérifications :

```bash
# Linter
pnpm lint

# Corriger automatiquement les erreurs
pnpm lint:fix

# Formatter
pnpm format

# Build
pnpm build
```

## Structure du Code

### Ajout de Composants

Les composants UI de base (style Shadcn) vont dans `src/components/ui/`.

Les composants métier vont directement dans `src/components/`.

### Styles

Le projet utilise TailwindCSS. Les styles globaux et les variables CSS sont dans `src/index.css`.

### Utilitaires

Les fonctions utilitaires vont dans `src/lib/`.

## Convention de Commits

Nous suivons les conventions de commits classiques :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, pas de changement de code
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Maintenance

Exemple :

```bash
git commit -m "feat: add dark mode toggle button"
```

## Soumettre une Pull Request

1. Créez une branche pour votre fonctionnalité :

```bash
git checkout -b feat/ma-fonctionnalite
```

2. Commitez vos changements
3. Poussez vers votre fork :

```bash
git push origin feat/ma-fonctionnalite
```

4. Ouvrez une Pull Request sur le dépôt principal

## Questions ?

N'hésitez pas à ouvrir une issue pour toute question ou suggestion !
