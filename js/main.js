/**
 * INITIALISATION & ÉVÉNEMENTS
 * Ce fichier est le point d'entrée. Il attache les écouteurs d'événements aux éléments HTML.
 */

// On attend que toute la page (HTML + CSS + Images) soit chargée avant de lancer le script
// Cela évite d'essayer d'accéder à des éléments qui n'existent pas encore
window.addEventListener("load", init);

// Fonction principale d'initialisation
function init() {
  // --- 1. Gestion du Slider de rayon (Distance) ---
  // On vérifie si l'élément existe sur la page actuelle (évite les erreurs sur les autres pages)
  if (SLIDER_RADIUS) {
    // Événement 'input' : se déclenche en temps réel pendant le glissement (pour mettre à jour le texte)
    SLIDER_RADIUS.addEventListener("input", onSliderInput);
    // Événement 'change' : se déclenche quand l'utilisateur relâche la souris (pour lancer la recherche)
    SLIDER_RADIUS.addEventListener("change", onSliderChange);
  }

  // --- 2. Gestion des Filtres (Oiseaux, Plantes...) ---
  if (FILTERS_CONTAINER) {
    // On récupère tous les boutons à l'intérieur du conteneur
    const BUTTONS = FILTERS_CONTAINER.getElementsByClassName("filter-btn");
    // On boucle sur chaque bouton pour lui ajouter un écouteur de clic
    for (let i = 0; i < BUTTONS.length; i++) {
      BUTTONS[i].addEventListener("click", onFilterClick);
    }
  }

  // --- 3. Gestion du bouton de géolocalisation ---
  if (BTN_LOCATE) {
    // Au clic, on lance la demande de GPS
    BTN_LOCATE.addEventListener("click", demarrerGeolocalisation);
    // Au chargement de la page, on vérifie s'il y a déjà des données en mémoire pour les afficher
    chargerDernierePosition();
  }

  // --- 4. Gestion de la Carte ---
  // Si la div "map" existe, on initialise Leaflet
  if (document.getElementById("map")) {
    initMap();
  }

  // --- 5. Gestion de la page Favoris ---
  if (CONTAINER_FAVORIS) {
    // On affiche la liste des favoris stockés
    afficherPageFavoris();
    // On calcule le niveau (badges) de l'utilisateur
    calculerBadges();
  }

  // --- 6. Gestion des Badges (Easter Egg) ---
  if (BADGES_CONTAINER) {
    // On écoute les clics sur la zone des badges pour le secret de l'œuf
    BADGES_CONTAINER.addEventListener("click", onBadgeClick);
  }

  // --- 7. Gestion de la Caméra (Page Identification) ---
  if (INPUT_CAMERA) {
    initCameraPage();
  }

  // --- 8. Gestion du Carnet (Bio-Dex) ---
  if (CONTAINER_DEX) {
    afficherCarnet();
  }
}

/**
 * GESTIONNAIRES D'ÉVÉNEMENTS (HANDLERS)
 * Ces fonctions sont appelées par les "addEventListener" ci-dessus.
 */

// Appelé quand on bouge le slider (visuel uniquement)
function onSliderInput() {
  // On convertit la valeur (string) en entier
  currentRadius = parseInt(SLIDER_RADIUS.value);
  // On met à jour le texte à côté du slider (ex: "5 km")
  LABEL_RADIUS.innerText = currentRadius;
}

// Appelé quand on relâche le slider (action logique)
function onSliderChange() {
  // On s'assure que la variable globale est à jour
  currentRadius = parseInt(SLIDER_RADIUS.value);

  // Si on a déjà une position GPS valide
  if (currentLat !== null && currentLng !== null) {
    console.log("Nouveau rayon : " + currentRadius + "km -> Recherche...");
    // On relance la requête API avec le nouveau rayon
    chercherEspeces(currentLat, currentLng);
    // On redessine le cercle vert sur la carte (si on est sur la page carte)
    updateMapCircle();
  }
}

// Appelé quand on clique sur un filtre (Oiseau, Plante, etc.)
function onFilterClick(event) {
  // 1. Gestion visuelle : On retire la classe 'active' de tous les boutons
  const BUTTONS = FILTERS_CONTAINER.getElementsByClassName("filter-btn");
  for (let j = 0; j < BUTTONS.length; j++) {
    BUTTONS[j].classList.remove("active");
  }

  // 2. On ajoute la classe 'active' uniquement sur le bouton cliqué
  // event.currentTarget fait référence à l'élément qui porte l'écouteur (le bouton)
  event.currentTarget.classList.add("active");

  // 3. On récupère la valeur technique du filtre (ex: "Aves" pour oiseaux)
  // stockée dans l'attribut HTML personnalisé 'data-taxa'
  currentTaxa = event.currentTarget.getAttribute("data-taxa");
  console.log("Filtre changé : " + currentTaxa);

  // 4. Si on a une position, on relance la recherche immédiatement
  if (currentLat !== null && currentLng !== null) {
    chercherEspeces(currentLat, currentLng);
  }
}

// Appelé lors d'un clic sur la zone des badges (Secret)
function onBadgeClick(event) {
  // On vérifie si l'élément cliqué contient l'emoji Œuf
  if (event.target.innerText.includes("🥚")) {
    eggClickCount++; // On incrémente le compteur
    console.log("Click oeuf : " + eggClickCount);

    // Si on a cliqué 5 fois
    if (eggClickCount >= 5) {
      lancerEasterEgg(); // On lance l'animation
      eggClickCount = 0; // On remet le compteur à zéro pour recommencer plus tard
    }
  }
}

// Configuration spécifique à la page Caméra
function initCameraPage() {
  // Quand l'utilisateur sélectionne une photo ou prend une photo
  INPUT_CAMERA.addEventListener("change", onCameraInput);
  // Quand l'utilisateur clique sur le bouton "Identifier"
  BTN_IDENTIFY.addEventListener("click", onIdentifyClick);
}

// Traitement de la photo sélectionnée
function onCameraInput(event) {
  // Vérification de sécurité : est-ce qu'un fichier a bien été sélectionné ?
  if (INPUT_CAMERA.files && INPUT_CAMERA.files[0]) {
    // On stocke le fichier brut dans la variable globale
    selectedFile = INPUT_CAMERA.files[0];

    // On lance la compression de l'image (fonction utilitaire)
    // On passe 'onCompressionComplete' comme fonction de rappel (callback)
    // C'est elle qui sera exécutée une fois la compression finie
    compresserImage(selectedFile, onCompressionComplete);

    // On nettoie les résultats précédents pour ne pas mélanger
    if (IDENTIFY_RESULTS) IDENTIFY_RESULTS.innerHTML = "";
  }
}

// Appelé une fois que l'image est compressée et prête
function onCompressionComplete(base64) {
  // On sauvegarde l'image compressée (Base64) pour l'ajouter plus tard au carnet
  imageBase64Stockable = base64;

  // On affiche l'image dans la balise <img> de prévisualisation
  PREVIEW_IMAGE.src = base64;
  // On rend l'image visible (suppression de la classe display:none)
  PREVIEW_IMAGE.classList.remove("d-none");
  // On rend le bouton d'identification visible
  BTN_IDENTIFY.classList.remove("d-none");
}

// Lancement de l'analyse IA
function onIdentifyClick() {
  // Sécurité : on vérifie qu'un fichier est bien chargé
  if (selectedFile) {
    // On appelle la fonction métier qui contacte l'API PlantNet
    lancerIdentification(selectedFile);
  }
}
