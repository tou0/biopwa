/******************************************************************************/
/* Constants                                                                  */
/******************************************************************************/
// Incrémentez ce chiffre pour forcer la mise à jour chez les utilisateurs
const VERSION = "894.0";

// IMPORTANT : Ce nom doit être IDENTIQUE à celui dans js/globals.js
const USER_CACHE_NAME = 'bioquartier-user-images';

const RESSOURCES = [
  "./",
  "./index.html",
  "./favoris.html",
  "./camera.html",
  "./carte.html",
  "./carnet.html",
  "./service_worker.js",
  "./css/style.css",

  // FICHIERS JS
  "./js/globals.js",
  "./js/utils.js",
  "./js/logic.js",
  "./js/main.js",
  "./js/pwa.js",

  "./lib/bootstrap.min.css",
  "./favicon/site.webmanifest",
  "./favicon/favicon.ico",

  // --- BOOTSTRAP ICONS (LOCAL) ---
  "./lib/bootstrap-icons-1.13.1/bootstrap-icons.css",
  "./lib/bootstrap-icons-1.13.1/fonts/bootstrap-icons.woff",
  "./lib/bootstrap-icons-1.13.1/fonts/bootstrap-icons.woff2",

  // --- LEAFLET (LOCAL) ---
  "./lib/leaflet/leaflet.js",
  "./lib/leaflet/leaflet.css",
  "./lib/leaflet/images/marker-icon.png",
  "./lib/leaflet/images/marker-shadow.png",
  "./lib/leaflet/images/marker-icon-2x.png",

  // --- ASSETS ---
  "./img/wet_owl.jpg",
  "./audio/gnomed.mp3"
];

/******************************************************************************/
/* Listeners                                                                  */
/******************************************************************************/
self.addEventListener("install", onInstall);
self.addEventListener("fetch", onFetch);

/******************************************************************************/
/* Install                                                                    */
/******************************************************************************/
function onInstall(event) {
  console.log("[SW] Installation - Version", VERSION);
  event.waitUntil(caching());
  self.skipWaiting(); // Force l'activation immédiate
}

/******************************************************************************/
async function caching() {
  const KEYS = await caches.keys();

  // Si la version actuelle n'existe pas encore, on l'installe
  if (!KEYS.includes(VERSION)) {
    console.log("[SW] Mise en cache des ressources statiques");
    const CACHE = await caches.open(VERSION);
    await CACHE.addAll(RESSOURCES);

    // NETTOYAGE DES VIEUX CACHES
    for (const KEY of KEYS) {
      // C'EST ICI LA CORRECTION CRITIQUE :
      // On supprime seulement si ce n'est PAS la version actuelle
      // ET si ce n'est PAS le cache des images utilisateur
      if (KEY !== VERSION && KEY !== USER_CACHE_NAME) {
        console.log("[SW] Suppression vieux cache:", KEY);
        await caches.delete(KEY);
      }
    }
  }
}

/******************************************************************************/
/* Fetch                                                                      */
/******************************************************************************/
function onFetch(event) {
  // 1. Stratégie pour les requêtes externes (PlantNet, iNaturalist, etc.)
  // On laisse le réseau gérer ça directement sans passer par le SW
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 2. Stratégie pour nos fichiers internes (Cache First)
  event.respondWith(getResponse(event.request));
}

/******************************************************************************/
async function getResponse(request) {
  // On regarde d'abord dans les caches (Système OU Utilisateur)
  const RESPONSE = await caches.match(request);

  if (RESPONSE) {
    return RESPONSE;
  } else {
    // Si pas en cache, on va chercher sur le réseau
    return fetch(request);
  }
}
