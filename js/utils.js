/**
 * UTILITAIRES TECHNIQUES
 * Ce fichier regroupe les fonctions génériques de gestion d'image et de système.
 */

/* --- GESTION DE LA COMPRESSION D'IMAGE (Refactorisé sans imbrication) --- */

/**
 * FONCTION : compresserImage
 * BUT : Point d'entrée pour redimensionner une image.
 * NOTE : Lance la lecture du fichier et délègue la suite à 'onFileRead'.
 */
function compresserImage(file, callback) {
  // Création d'un lecteur de fichier
  const READER = new FileReader();

  // ASTUCE : On attache le callback à l'objet READER pour pouvoir le récupérer
  // dans la fonction suivante (puisqu'on n'a pas le droit aux fonctions imbriquées)
  READER.customCallback = callback;

  // Définition de l'action via une fonction nommée externe
  READER.onload = onFileRead;

  // Lancement de la lecture
  READER.readAsDataURL(file);
}

/**
 * FONCTION : onFileRead
 * BUT : Appelé quand le fichier est chargé en mémoire. Crée l'objet Image.
 */
function onFileRead(event) {
  // On récupère le Reader qui a déclenché l'événement
  const THE_READER = event.target;

  // Création de l'image HTML
  const IMG = new Image();

  // On transmet le callback du Reader vers l'Image
  IMG.customCallback = THE_READER.customCallback;

  // Définition de la source (le Base64)
  IMG.src = THE_READER.result;

  // Définition de l'action suivante via une fonction nommée externe
  IMG.onload = onImageLoadedForResize;
}

/**
 * FONCTION : onImageLoadedForResize
 * BUT : Appelé quand l'image est prête. Fait le redimensionnement Canvas.
 */
function onImageLoadedForResize(event) {
  // On récupère l'image qui vient de charger
  const IMG = event.target;

  // Création d'un élément Canvas virtuel
  const CANVAS = document.createElement("canvas");

  // Définition de la largeur maximale
  const MAX_WIDTH = 800;

  // Calcul du ratio
  const SCALE_SIZE = MAX_WIDTH / IMG.width;

  // Application des dimensions
  CANVAS.width = MAX_WIDTH;
  CANVAS.height = IMG.height * SCALE_SIZE;

  // Récupération du contexte et dessin
  const CTX = CANVAS.getContext("2d");
  CTX.drawImage(IMG, 0, 0, CANVAS.width, CANVAS.height);

  // Conversion en JPEG 70%
  const DATA_URL = CANVAS.toDataURL("image/jpeg", 0.7);

  // On récupère le callback qu'on a fait voyager depuis le début
  // et on l'exécute avec le résultat final
  if (IMG.customCallback) {
    IMG.customCallback(DATA_URL);
  }
}

/* --- GESTION DU CACHE (API CACHE STORAGE) --- */

/**
 * FONCTION : saveImageToCache
 * BUT : Stocker une image Base64 dans le Cache Storage API.
 */
async function saveImageToCache(id, base64) {
  try {
    // Ouverture de l'espace de stockage
    const CACHE = await caches.open(CACHE_NAME_USER);

    // Récupération de l'image Base64 via fetch
    const RES = await fetch(base64);
    const BLOB = await RES.blob();

    // Création d'une URL fictive pour servir de clé
    const FAKE_URL = '/user-img/' + id;

    // Création manuelle de la Réponse HTTP
    const RESPONSE = new Response(BLOB, {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    });

    // Écriture dans le cache
    await CACHE.put(FAKE_URL, RESPONSE);
    console.log("Image sauvegardée dans le cache : " + FAKE_URL);
    return FAKE_URL;

  } catch (e) {
    console.error("Erreur sauvegarde cache", e);
    return null;
  }
}

/**
 * FONCTION : getImageFromCache
 * BUT : Récupérer une image stockée pour l'afficher.
 */
async function getImageFromCache(id) {
  try {
    const CACHE = await caches.open(CACHE_NAME_USER);
    const FAKE_URL = '/user-img/' + id;
    const RESPONSE = await CACHE.match(FAKE_URL);

    if (RESPONSE) {
      const BLOB = await RESPONSE.blob();
      return URL.createObjectURL(BLOB);
    }
    return null;
  } catch (e) {
    console.error("Erreur lecture cache", e);
    return "img/placeholder.png";
  }
}

/**
 * FONCTION : deleteImageFromCache
 * BUT : Supprimer une image.
 */
async function deleteImageFromCache(id) {
  const CACHE = await caches.open(CACHE_NAME_USER);
  await CACHE.delete('/user-img/' + id);
}

/* --- OUTILS SYSTÈME (CLIPBOARD & EASTER EGG) --- */

/**
 * FONCTION : copierDansPressePapier
 * BUT : Copier du texte (Wrapper pour gérer l'async sans promesse visible).
 */
function copierDansPressePapier(contenu) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    tenterCopiePressePapier(contenu);
  } else {
    alert("Copiez : " + contenu);
  }
}

/**
 * FONCTION : tenterCopiePressePapier
 * BUT : Fonction asynchrone isolée pour la copie.
 */
async function tenterCopiePressePapier(contenu) {
  try {
    await navigator.clipboard.writeText(contenu);
    alert("Lien copié !");
  } catch (err) {
    alert("Copiez : " + contenu);
  }
}

/**
 * FONCTION : lancerEasterEgg
 * BUT : Afficher une animation cachée.
 */
function lancerEasterEgg() {
  const AUDIO = new Audio('./audio/gnomed.mp3');
  AUDIO.volume = 1.0;

  jouerAudioSafe(AUDIO);

  // Création de l'overlay (écran noir)
  const OVERLAY = document.createElement("div");
  // ... Styles CSS JS ...
  OVERLAY.style.position = "fixed";
  OVERLAY.style.top = "0";
  OVERLAY.style.left = "0";
  OVERLAY.style.width = "100%";
  OVERLAY.style.height = "100%";
  OVERLAY.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  OVERLAY.style.zIndex = "9999";
  OVERLAY.style.display = "flex";
  OVERLAY.style.flexDirection = "column";
  OVERLAY.style.justifyContent = "center";
  OVERLAY.style.alignItems = "center";
  OVERLAY.style.cursor = "pointer";

  // Création de l'image
  const IMG = document.createElement("img");
  IMG.src = "img/wet_owl.jpg";
  IMG.style.maxWidth = "90%";
  IMG.style.maxHeight = "70%";
  IMG.style.borderRadius = "15px";
  IMG.style.boxShadow = "0 0 50px rgba(255,255,255,0.2)";
  IMG.alt = "HOOT HOOT";

  // Création du texte
  const TEXT = document.createElement("h2");
  TEXT.innerText = "Hoot !";
  TEXT.style.color = "white";
  TEXT.style.marginTop = "20px";
  TEXT.style.fontFamily = "Comic Sans MS, cursive";

  OVERLAY.appendChild(IMG);
  OVERLAY.appendChild(TEXT);
  document.body.appendChild(OVERLAY);

  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

  // Passage de l'audio par référence à l'élément DOM
  OVERLAY.customAudioRef = AUDIO;
  OVERLAY.addEventListener("click", onOverlayClick);
}

/**
 * FONCTION : onOverlayClick
 * BUT : Gère la fermeture de l'Easter Egg.
 */
function onOverlayClick(event) {
  const OVERLAY = event.currentTarget;
  const AUDIO = OVERLAY.customAudioRef;

  OVERLAY.remove();

  if (AUDIO) {
    AUDIO.pause();
    AUDIO.currentTime = 0;
  }
}

/**
 * FONCTION : jouerAudioSafe
 * BUT : Tenter de jouer l'audio (Async isolé).
 */
async function jouerAudioSafe(audioObject) {
  try {
    await audioObject.play();
  } catch (e) {
    console.log("Lecture audio bloquée par le navigateur");
  }
}