/******************************************************************************/
/* Constants                                                                  */
/******************************************************************************/

// Récupération de la référence du bouton d'installation dans le DOM
// Ce bouton est caché par défaut en CSS (display: none)
const INSTALL_BUTTON = document.getElementById("install_button");

/******************************************************************************/
/* Listeners                                                                  */
/******************************************************************************/

// Vérification de sécurité : on n'ajoute l'écouteur que si le bouton existe dans la page
if (INSTALL_BUTTON) {
  // Ajout de l'événement 'click' pour déclencher l'installation manuelle
  INSTALL_BUTTON.addEventListener("click", installPwa);
}

/******************************************************************************/
/* Global Variable                                                            */
/******************************************************************************/

// Variable pour stocker l'événement navigateur 'beforeinstallprompt'
// C'est nécessaire car cet événement se déclenche très tôt et on doit le garder
// en mémoire pour l'utiliser plus tard (quand l'utilisateur clique sur le bouton)
let beforeInstallPromptEvent;

/******************************************************************************/
/* Main                                                                       */
/******************************************************************************/

// Point d'entrée : on attend que la page soit entièrement chargée pour lancer la logique PWA
window.addEventListener("load", mainPwa);

function mainPwa() {
  console.log("mainPwa()");

  // 1. Enregistrement du Service Worker
  // On vérifie d'abord si le navigateur supporte les Service Workers
  if ("serviceWorker" in navigator) {
    registerServiceWorker();
  }

  // 2. Gestion de l'interface d'installation
  // On vérifie si l'application tourne déjà en mode "Standalone" (comme une app native)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    console.log("Running as PWA");
    // Ici, pas besoin d'afficher le bouton d'installation, l'app est déjà installée
  } else {
    console.log("Running as Web page");
    // Si on est dans le navigateur classique, on écoute les événements d'installation

    // 'beforeinstallprompt' : Le navigateur détecte que le site est installable
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // 'appinstalled' : L'installation vient de se terminer avec succès
    window.addEventListener("appinstalled", onAppInstalled);
  }
}

/******************************************************************************/
/* Install PWA                                                                */
/******************************************************************************/

/**
 * Fonction déclenchée automatiquement par le navigateur quand le site est éligible à l'installation
 * (HTTPS + Manifest valide + Service Worker actif)
 */
function onBeforeInstallPrompt(event) {
  console.log("onBeforeInstallPrompt()");

  // IMPORTANT : On empêche le navigateur d'afficher sa bannière par défaut immédiatement
  // On veut contrôler le moment où l'on propose l'installation
  event.preventDefault();

  // On affiche notre propre bouton d'installation personnalisé
  if (INSTALL_BUTTON) {
    INSTALL_BUTTON.disabled = false;
    INSTALL_BUTTON.style.display = "block"; // On rend le bouton visible
  }

  // On sauvegarde l'événement dans la variable globale pour l'utiliser dans 'installPwa'
  beforeInstallPromptEvent = event;
}

/**
 * Fonction déclenchée quand l'utilisateur clique sur NOTRE bouton "Installer"
 */
async function installPwa() {
  console.log("installPwa()");

  // Sécurité : si l'événement n'a pas été capturé, on ne peut rien faire
  if (!beforeInstallPromptEvent) return;

  // On déclenche la fenêtre modale native d'installation du navigateur
  // C'est une opération asynchrone qui attend la réponse de l'utilisateur
  const RESULT = await beforeInstallPromptEvent.prompt();

  // On logue le choix de l'utilisateur (Accepté ou Refusé)
  if (RESULT.outcome === "accepted") {
    console.log("PWA Install accepted");
  } else {
    console.log("PWA Install dismissed");
  }

  // Une fois l'invite affichée, l'événement ne peut plus être utilisé
  // On désactive le bouton pour éviter de cliquer à nouveau
  if (INSTALL_BUTTON) INSTALL_BUTTON.disabled = true;

  // On nettoie l'écouteur car l'installation a été traitée
  window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
}

/**
 * Fonction déclenchée quand l'installation est terminée
 */
function onAppInstalled() {
  console.log("onAppInstalled()");
  // L'application est installée, on cache le bouton d'installation
  if (INSTALL_BUTTON) INSTALL_BUTTON.style.display = "none";
}

/******************************************************************************/
/* Register Service Worker                                                    */
/******************************************************************************/

/**
 * Enregistre le fichier 'service_worker.js' qui gère le cache et le mode hors-ligne
 */
async function registerServiceWorker() {
  console.log("registerServiceWorker()");
  try {
    // Appel asynchrone pour enregistrer le fichier SW situé à la racine
    const REGISTRATION = await navigator.serviceWorker.register("./service_worker.js");

    // Succès : Le SW est enregistré et va commencer à mettre en cache les fichiers
    console.log("Service Worker registration successful with scope:", REGISTRATION.scope);
  } catch (error) {
    // Échec : Problème de chemin, de HTTPS ou de syntaxe dans le SW
    console.error("Service Worker registration failed:", error);
  }
}
