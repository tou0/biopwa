# /!\ BOOTSTRAP ICONS TO ADD

# BioQuartier v1.0
Le "Pokémon GO" de la biodiversité : Scannez, Identifiez, Collectionnez.

BioQuartier est une application web mobile (PWA) qui transforme vos balades en chasse au trésor. Le but ? Trouver les espèces autour de vous, les prendre en photo pour les identifier grâce à une IA, et remplir votre propre "Bio-Dex".

Ne volez pas la clé API, la création d'un compte PlantNet est gratuite...

**Démo en ligne :** https://srv-peda2.iut-acy.univ-smb.fr/levelm/bio

---

## La Petite Histoire du Projet

**L'idée de départ :**
Au début, je voulais juste faire une carte qui affiche les fleurs et les animaux du quartier. C'était sympa, mais un peu passif.

**L'inspiration Pokémon :**
Je me suis alors demandé : *"Comment rendre ça addictif ?"*. Je me suis inspiré des jeux **Pokémon**. J'ai voulu que l'utilisateur devienne un "dresseur" de biodiversité. Il ne doit pas juste regarder la carte, il doit **capturer** (scanner) les plantes pour remplir son carnet de collection (mon équivalent du Pokédex).

**Le Gros Problème Technique :**
Quand j'ai commencé à coder le scanner, je voulais que l'utilisateur garde ses photos sur son téléphone. J'ai essayé de les stocker "simplement" (LocalStorage), mais la mémoire a saturé après 3 photos...
J'ai dû trouver une astuce de contournement (expliquée plus bas) pour stocker des centaines de photos sans faire planter l'appli.

**Citation du site iNaturalist**
``` text
iNaturalist vous offre un endroit où enregistrer et organiser vos découvertes sur la nature, rencontrer d'autres amateurs de la nature, et en en apprendre plus sur le monde naturel.
Nous encourageons la participation d'une large variété d'amoureux de la nature, comprenant entre autres randonneurs, chasseurs, ornithologues, chercheurs de plage, cueilleurs de champignons et pêcheurs. 


Par la mise en relation de leurs différentes perceptions et de leur expertise du monde naturel, iNaturalist espère engendrer une initiative efficace de sensibilisation à la biodiversité locale au sein de la communauté ainsi que de promouvoir une exploration approfondie des environnements locaux.
```

**Citation du site PlantNet**
```text
Pl@ntNet API provides a computational access to the visual identification engine used in Pl@ntNet apps in the form of a RESTful Web service.
The service allows you to submit simultaneously from 1 to 5 images of the same plant and to have in return the list of the most likely species as well as a confidence score for each of them.
The identification engine is based on most advanced deep learning technologies and is regularly updated thanks to the contributions of the community and the integration of new expert databases.
```
---

## Ce qu'on peut faire avec l'App

### Le Radar (Exploration)
Comme dans un jeu, l'appli vous géolocalise et vous montre les espèces cachées autour de vous (grâce aux données d'iNaturalist).
* **Carte :** Il y a également une carte permettant de voir où on était prise les photos de la biodiversité autour de vous.
* **Badges :** Plus vous collectionnez de favoris, plus vous gagnez des badges.

### Le Scanner (Identification)
Vous voyez une plante inconnue ?
1. Prenez une photo.
2. L'Intelligence Artificielle (**PlantNet**) l'analyse en 2 secondes.
3. Elle vous donne son nom et le pourcentage de correspondance.

### Le Bio-Dex (Collection)
Chaque plante scannée est ajoutée à votre carnet.
* **Gamification** Plus vous identifiez de plantes, plus vous montez en niveau.
* **Souvenirs :** Vos photos sont sauvegardées dans le téléphone.
  
---

## Les Défis Techniques

### 1. Stocker les photos 
* **Le souci :** Le navigateur ne donne qu'une toute petite boîte pour sauvegarder des données (LocalStorage = 5 Mo). Une seule photo HD remplit tout !
* **La solution :** J'ai détourné une autre boîte de rangement beaucoup plus grande : le **Cache Storage**. Je m'en sers pour y stocker les photos de l'utilisateur.

### 2. Rétrécir les images 
* **Le souci :** Envoyer une photo de 5 Mo à l'IA avec une petite 4G, c'est trop long.
* **La solution :** Avant d'envoyer la photo, mon code la redessine en tout petit et en moins bonne qualité (invisible à l'œil nu sur mobile) grâce à un outil appelé **Canvas**. La photo devient 30 fois plus légère instantanément.

### 3. Un code propre 
Pour ne pas me perdre dans mon code, j'ai tout rangé dans des fichiers séparés (un pour les constantes globales, un pour les utilitaires, un pour la logique du jeu...). J'utilise aussi du JavaScript moderne (**Async/Await**) pour que le code soit facile à lire.

---

## Stack Technique

* **Langage :** JavaScript 
* **Carte :** Leaflet.
* **Design :** Bootstrap 5.
* **APIs Externes (Internet) :**
    * **iNaturalist :** Pour récupérer les données de biodiversité.
    * **PlantNet :** Pour l'identification par IA.
* **APIs Internes (Navigateur) :**
    * **Geolocation API :** Pour le GPS.
    * **Cache Storage API :** Pour le stockage des photos.
    * **Canvas API :** Pour la compression des images.
    * **Vibration API :** Pour le retour haptique (petites vibrations).
---

## Organisation du dossier

```text
BioQuartier/
├── audio/               # L'easter egg
├── css/                 # Le design
├── favicon/             # Assets graphiques & Manifest
├── img/                 # L'easter egg aussi
├── js/ 
│   ├── globals.js       # Les réglages 
│   ├── main.js          # Les clics et boutons  
│   ├── logic.js         # Le cerveau du jeu (API, Badges...) 
│   ├── utils.js         # La boîte à outils (Compression, Cache)  
│   └── pwa.js           # L'installation sur mobile
├── lib/                 # Les bibliothèques 
├── index.html           # La page principale 
├── camera.html          # La page pour scanner les plantes 
├── carte.html           # La page qui contient la carte
├── carnet.html          # La page qui contient le BioDex
├── favoris.html         # La page contenant les favoris de l'utilisateur
└── service_worker.js    # Ce qui permet à l'app de marcher hors-ligne 

```
---

## Auteur

**tou**
* Projet réalisé dans le cadre du BUT R&T.

# Remerciements

Je tiens à remercier les différentes API, iNaturalist et PlantNet.
