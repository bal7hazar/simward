# Configuration asdf

Ce projet utilise **asdf** pour gérer les versions de Node.js et pnpm.

## Installation d'asdf

### macOS (avec Homebrew)

```bash
brew install asdf
```

### Linux

Suivez les instructions sur [asdf-vm.com](https://asdf-vm.com/guide/getting-started.html)

## Configuration du Shell

Ajoutez asdf à votre shell :

### Bash

```bash
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ~/.bashrc
```

### Zsh

```bash
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ~/.zshrc
```

## Installation des Plugins

```bash
# Plugin Node.js
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

# Plugin pnpm
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
```

## Installation des Versions

Les versions sont définies dans le fichier `.tool-versions` à la racine du projet.

```bash
# Dans le dossier du projet
asdf install
```

Cela installera :
- Node.js (dernière version stable)
- pnpm 9.15.2

## Vérification

```bash
# Vérifier les versions installées
asdf current

# Devrait afficher :
# nodejs          22.x.x         /path/to/project/.tool-versions
# pnpm            9.15.2          /path/to/project/.tool-versions
```

## Utilisation

Une fois configuré, asdf détecte automatiquement les versions à utiliser quand vous êtes dans le dossier du projet grâce au fichier `.tool-versions`.

## Mise à Jour des Versions

Pour mettre à jour les versions :

1. Modifiez le fichier `.tool-versions`
2. Exécutez `asdf install`
3. Commitez le fichier `.tool-versions` mis à jour

## Ressources

- [Documentation asdf](https://asdf-vm.com/)
- [Plugin Node.js](https://github.com/asdf-vm/asdf-nodejs)
- [Plugin pnpm](https://github.com/jonathanmorley/asdf-pnpm)
