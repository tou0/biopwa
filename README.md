# BioQuartier v1.0
Le "Pokémon GO" de la biodiversité : Scannez, Identifiez, Collectionnez.

BioQuartier est une application web mobile (PWA) qui transforme vos balades en chasse au trésor. Le but ? Trouver les espèces autour de vous, les prendre en photo pour les identifier grâce à une IA, et remplir votre propre "Bio-Dex".

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
* 
---

## Les Défis Techniques

### 1. Stocker les photos 
* **Le souci :** Le navigateur ne donne qu'une toute petite boîte pour sauvegarder des données (LocalStorage = 5 Mo). Une seule photo HD remplit tout !
* **La solution :** J'ai détourné une autre boîte de rangement beaucoup plus grande : le **Cache Storage**. Je m'en sers pour y stocker les photos de l'utilisateur.

### 2. Rétrécir les images 
* **Le souci :** Envoyer une photo de 5 Mo à l'IA avec une petite 4G, c'est trop long.
* **La solution :** Avant d'envoyer la photo, mon code la redessine en tout petit et en moins bonne qualité (invisible à l'œil nu sur mobile) grâce à un outil appelé **Canvas**. La photo devient 30 fois plus légère instantanément.

### 3. Un code propre 
Pour ne pas me perdre dans mon code, j'ai tout rangé dans des fichiers séparés (un pour la carte, un pour les outils, un pour la logique du jeu...). J'utilise aussi du JavaScript moderne (**Async/Await**) pour que le code soit facile à lire, comme une histoire.

---

## Outils utilisés

* **Langage :** JavaScript 
* **Carte :** Leaflet.
* **Données :** API iNaturalist (pour trouver) & API PlantNet (pour identifier).
* **Design :** Bootstrap 5.

---

## Organisation du dossier

BioQuartier/ 
├── index.html           # La page principale 
├── camera.html          # La page pour scanner les plantes 
├── carte.html           # La page qui contient la carte
├── carnet.html          # La page qui contient le BioDex
├── favoris.html         # La page contenant les favoris de l'utilisateur
├── service_worker.js    # Ce qui permet à l'app de marcher hors-ligne 
├── css/                 # Le design 
├── audio/               # L'easter egg
├── img/                 # L'easter egg aussi
├── favicon/             # Assets graphiques & Manifest
├── js/ 
│   ├── globals.js       # Les réglages 
│   ├── main.js          # Les clics et boutons  
│   ├── logic.js         # Le cerveau du jeu (API, Badges...) 
│   ├── utils.js         # La boîte à outils (Compression, Cache)  
│   └── pwa.js           # L'installation sur mobile 
└── manifest.json        # L'icône et le nom de l'app


---

## Auteur

**tou**
Projet réalisé dans le cadre du BUT R&T.
