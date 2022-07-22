# Convertisseur N4DS

Ce script permet de convertir un fichier [N4DS](https://www.net-entreprises.fr/declaration/dads-u) multi organisations en autant de fichiers N4DS que de collectivités. Les fichiers N4DS sont nommés avec le SIRET, le nom de la collectivité et une clé aléatoire. Un fichier descripteur `index.csv` est également généré dans le dossier de sortie.

## Pré-requis

Vous devez disposer de l'environnement d'exécution `node.js` et de son gestionnaire de paquets `npm` sur l'ordinateur de travail.

Pour la prise en charge des caractères spéciaux, le script assume le fichier d'entrée est encodé au format Unicode (`ISO-8859-1`). Cet encodage est également appliqué aux fichiers générés. Normalement, vous n'avez rien de spécial à faire si le fichier N4DS a été généré à partir d'un ordinateur configuré en français.

## installation

Clonez le dépôt git, ou téléchargez-le au format zip puis décompressez-le.

## Usage

Dans le dossier d'installation, exécutez la commande :

```shell
npm start "chemin/du/fichier/N4DS_multi_collectivite.txt" "chemin/du/dossier/de/sortie"
```

Exemple powershell, avec le fichier source `N4DS_multicoll.txt` dans un dossier `./test` placé dans le dossier d'installation, et un nom de dossier de sortie généré à la date d'exécution dans le même dossier `./test` :

```shell
Invoke-Expression "npm start -- './test/N4DS_multicoll.txt' './test/$(get-date -f "yyyyMMdd-HHmmss")'"
```
