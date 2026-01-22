/**
 * LOGIQUE MÉTIER (Map, API, Dex)
 * Ce fichier contient toutes les fonctions qui font "réfléchir" l'application.
 */

// --- SÉCURITÉ (XSS) ---

/**
 * Nettoie une chaîne de caractères pour empêcher l'exécution de code malveillant (XSS).
 * Transforme les <script> en &lt;script&gt; (texte inoffensif).
 */
function echapperHTML(texte) {
  if (!texte) return "";
  return texte
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- GÉOLOCALISATION & RECHERCHE ---

// Fonction déclenchée par le bouton "Autour de moi"
function demarrerGeolocalisation() {
  // Vérifie si le navigateur supporte l'API Geolocation
  if (!navigator.geolocation) {
    // Si non, affiche un message d'erreur dans l'UI
    if (STATUS_MSG) STATUS_MSG.innerText = "Non supporté.";
    // Arrête la fonction
    return;
  }
  // Affiche un feedback "chargement" à l'utilisateur
  if (STATUS_MSG) STATUS_MSG.innerText = "Localisation...";
  // Demande la position actuelle (succès -> callback1, erreur -> callback2)
  navigator.geolocation.getCurrentPosition(succesGeolocalisation, erreurGeolocalisation);
}

// Fonction appelée automatiquement quand le GPS a trouvé la position
function succesGeolocalisation(position) {
  // Récupère la latitude depuis l'objet position
  currentLat = position.coords.latitude;
  // Récupère la longitude
  currentLng = position.coords.longitude;

  // Affiche les coordonnées arrondies (4 décimales) avec un Template Literal
  if (STATUS_MSG) STATUS_MSG.innerText = `Pos : ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;

  // Déclenche une vibration de 200ms pour le feedback haptique
  if (navigator.vibrate) navigator.vibrate(200);

  // Sauvegarde les coordonnées dans le LocalStorage
  sauvegarderPosition(currentLat, currentLng);

  // Si la carte est active, on centre la vue sur la nouvelle position
  if (mapObject) {
    mapObject.setView([currentLat, currentLng], ZOOM_LEVEL);
  }

  // Lance la recherche d'espèces via l'API iNaturalist
  chercherEspeces(currentLat, currentLng);
}

// Callback en cas d'erreur du GPS
function erreurGeolocalisation() {
  // Informe l'utilisateur que la localisation a échoué
  if (STATUS_MSG) STATUS_MSG.innerText = "Impossible de vous localiser.";
}

// Fonction asynchrone pour interroger l'API iNaturalist
async function chercherEspeces(lat, lng) {
  // Construit l'URL de l'API avec les paramètres (lat, lng, rayon) via Template Literal
  let url = `${API_BASE_URL}?lat=${lat}&lng=${lng}&radius=${currentRadius}&photos=true&per_page=${MAX_RESULTS}`;

  // Si un filtre est actif (ex: Oiseaux), on l'ajoute à l'URL
  if (currentTaxa !== "") {
    url += `&iconic_taxa=${currentTaxa}`;
  }

  // Affiche un spinner de chargement dans le conteneur de résultats
  if (CONTAINER_RESULTS) {
    CONTAINER_RESULTS.innerHTML = '<div class="text-center spinner-border text-success my-5"></div>';
  }

  try {
    // Exécute la requête HTTP GET et attend la réponse (await)
    const RESPONSE = await fetch(url);
    // Si le statut HTTP n'est pas 200-299, lève une erreur
    if (!RESPONSE.ok) throw new Error(`Erreur HTTP : ${RESPONSE.status}`);

    // Parse le corps de la réponse en JSON
    const DATA = await RESPONSE.json();
    // Stocke les résultats dans la variable globale
    dernieresObservations = DATA.results;

    // Met en cache les résultats dans le LocalStorage
    localStorage.setItem(STORAGE_RESULTS_KEY, JSON.stringify(dernieresObservations));

    // Si on est sur la vue liste, affiche les cartes HTML
    if (CONTAINER_RESULTS) {
      afficherResultats(dernieresObservations);
      // Sinon, si on est sur la vue carte, affiche les marqueurs
    } else if (mapObject) {
      afficherSurCarte(dernieresObservations);
    }

  } catch (error) {
    // Log l'erreur en console pour le débug
    console.error("Erreur API :", error);
    // Affiche l'erreur à l'utilisateur
    if (CONTAINER_RESULTS) CONTAINER_RESULTS.innerHTML = `Erreur : ${error.message}`;
  }
}

// --- CARTE (LEAFLET) ---

// Initialise la carte interactive
function initMap() {
  // Valeurs par défaut
  let lat = DEFAULT_LAT;
  let lng = DEFAULT_LNG;
  let zoom = DEFAULT_ZOOM;

  // Récupère la dernière position connue du storage
  const SAVED = localStorage.getItem(STORAGE_POS_KEY);
  if (SAVED) {
    // Parse le JSON pour récupérer l'objet
    const POS = JSON.parse(SAVED);
    // Met à jour les variables locales
    lat = POS.lat;
    lng = POS.lng;
    // Met à jour les globales
    currentLat = lat;
    currentLng = lng;
    // Ajuste le zoom
    zoom = ZOOM_LEVEL;
  }

  // Instancie la carte Leaflet dans la div #map
  mapObject = L.map('map').setView([lat, lng], zoom);

  // Ajoute la couche de tuiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapObject);

  // Ajoute un écouteur d'événement au clic sur la carte
  mapObject.on('click', onMapClick);

  // Si on a une position, on lance la recherche et on dessine le rayon
  if (currentLat && currentLng) {
    chercherEspeces(currentLat, currentLng);
    updateMapCircle();
  }
}

// Gestionnaire d'événement du clic carte
function onMapClick(e) {
  // Récupère lat/lng de l'endroit cliqué
  currentLat = e.latlng.lat;
  currentLng = e.latlng.lng;
  // Lance la recherche sur ce point
  chercherEspeces(currentLat, currentLng);
  // Met à jour le cercle visuel
  updateMapCircle();
}

// Dessine le cercle vert représentant le rayon de recherche
function updateMapCircle() {
  if (mapObject) {
    // Supprime les anciens cercles via la fonction cleanMapLayers
    mapObject.eachLayer(cleanMapLayers);
    // Crée un nouveau cercle avec les options de style (vert Bootstrap)
    L.circle([currentLat, currentLng], {
      color: 'green',
      fillColor: '#198754',
      fillOpacity: 0.1,
      radius: currentRadius * 1000 // Conversion km -> mètres
    }).addTo(mapObject); // Ajoute à la carte
  }
}

// Fonction utilitaire pour nettoyer les couches
function cleanMapLayers(layer) {
  // Si la couche est un cercle, on la supprime
  if (layer instanceof L.Circle) {
    mapObject.removeLayer(layer);
  }
}

// Affiche les marqueurs sur la carte
function afficherSurCarte(observations) {
  // Boucle pour supprimer les anciens marqueurs stockés
  for (let i = 0; i < mapMarkers.length; i++) {
    mapObject.removeLayer(mapMarkers[i]);
  }
  // Réinitialise le tableau des marqueurs
  mapMarkers = [];

  let obs, lat, lng, marker, nom, img;

  // Parcourt les observations
  for (let i = 0; i < observations.length; i++) {
    obs = observations[i];
    // Vérifie la présence de coordonnées GeoJSON
    if (obs.geojson && obs.geojson.coordinates) {
      // GeoJSON est [long, lat], Leaflet veut [lat, long]
      lat = obs.geojson.coordinates[1];
      lng = obs.geojson.coordinates[0];

      // Détermine le nom (commun ou scientifique)
      nom = "Inconnu";
      if (obs.taxon) {
        nom = obs.taxon.preferred_common_name || obs.taxon.name;
      }

      // Gestion de l'image (petite taille)
      img = "";
      if (obs.photos && obs.photos.length > 0) {
        img = obs.photos[0].url.replace("square", "small");
      }

      // Crée le marqueur et l'ajoute à la carte
      marker = L.marker([lat, lng]).addTo(mapObject);
      // Associe la popup HTML au marqueur (AVEC SÉCURITÉ XSS)
      // On passe le nom nettoyé à la fonction createPopupContent, ou on nettoie dedans.
      // Ici je nettoie dans createPopupContent directement.
      marker.bindPopup(createPopupContent(nom, img, i));
      // Ajoute le marqueur au tableau de suivi
      mapMarkers[mapMarkers.length] = marker;
    }
  }
  // Log le nombre d'éléments affichés
  console.log(`${observations.length} espèces affichées sur la carte.`);
}

// Génère le HTML de la popup
function createPopupContent(nom, img, index) {
  // SÉCURITÉ XSS : On nettoie le nom avant affichage
  const nomSafeHTML = echapperHTML(nom);

  // Retourne une string HTML avec Template Literal
  return `
    <div class="text-center">
      <strong>${nomSafeHTML}</strong><br>

      <img src="${img}" class="mt-2" style="width:100px;height:100px;object-fit:cover;border-radius:4px;"><br>
      <button class="btn btn-sm btn-modern btn-main mt-2" onclick="basculerFavori(${index})">
        <i class="bi bi-heart-fill"></i> Favori
      </button>
    </div>`;
}

// --- PERSISTANCE & AFFICHAGE ---

// Sauvegarde lat/lng dans LocalStorage
function sauvegarderPosition(lat, lng) {
  // Transforme l'objet JS en string JSON
  localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({
    lat: lat,
    lng: lng
  }));
}

// Restaure l'état au chargement de la page
function chargerDernierePosition() {
  // Récupère la position
  const SAVED_POS = localStorage.getItem(STORAGE_POS_KEY);
  if (SAVED_POS) {
    const POS = JSON.parse(SAVED_POS);
    currentLat = POS.lat;
    currentLng = POS.lng;
    if (STATUS_MSG) STATUS_MSG.innerText = "Dernière position connue chargée.";
  }

  // Récupère les résultats précédents
  const SAVED_RESULTS = localStorage.getItem(STORAGE_RESULTS_KEY);
  if (SAVED_RESULTS) {
    dernieresObservations = JSON.parse(SAVED_RESULTS);
    console.log("Données restaurées depuis la mémoire :", dernieresObservations.length);

    // Affiche les données selon la page active
    if (CONTAINER_RESULTS) {
      afficherResultats(dernieresObservations);
    } else if (mapObject) {
      afficherSurCarte(dernieresObservations);
    }
  }
}

// Génère la liste HTML des résultats
function afficherResultats(observations, animer = true) {
  // Sécurité : si pas de conteneur, stop
  if (!CONTAINER_RESULTS) return;

  // Sauvegarde la position du scroll
  const SCROLL_Y = window.scrollY;
  CONTAINER_RESULTS.innerHTML = "";

  // Gestion cas vide
  if (!observations || observations.length === 0) {
    CONTAINER_RESULTS.innerHTML = '<div class="col-12 text-center text-muted">Rien trouvé avec ces filtres...</div>';
    return;
  }

  let obs, nomEspece, imageSrc, estFav, icone, boutonClass;
  let nomSafe, lieuSafe, col, urlObservation;
  let classeAnimation = "";

  // Active l'animation CSS si demandé
  if (animer) {
    classeAnimation = "reveal-item";
  }

  // Boucle sur chaque observation
  for (let i = 0; i < observations.length; i++) {
    obs = observations[i];
    nomEspece = "Espèce inconnue";
    imageSrc = "https://via.placeholder.com/300?text=Pas+d'image";

    // Récupération sécurisée du nom de l'espèce
    if (obs.taxon) {
      if (obs.taxon.preferred_common_name) {
        nomEspece = obs.taxon.preferred_common_name;
      } else {
        nomEspece = obs.taxon.name;
      }
    }
    // Récupération de l'image (format medium)
    if (obs.photos && obs.photos.length > 0) {
      imageSrc = obs.photos[0].url.replace("square", "medium");
    }

    // Vérifie si l'ID est en favori pour adapter le style
    estFav = estDansFavoris(obs.id);
    if (estFav) {
      icone = '<i class="bi bi-heart-fill text-danger"></i>'; // Cœur plein rouge
      boutonClass = "btn-modern btn-main";
    } else {
      icone = '<i class="bi bi-heart"></i>'; // Cœur vide
      boutonClass = "btn-modern btn-sub";
    }

    // 1. Préparation pour le JS (Partage) : On échappe les apostrophes
    nomSafe = nomEspece.replace(REGEX_APOSTROPHE, "&apos;");
    lieuSafe = "ma position";
    if (obs.place_guess) {
      lieuSafe = obs.place_guess.replace(REGEX_APOSTROPHE, "&apos;");
    }

    // 2. SÉCURITÉ XSS (Affichage) : On échappe les caractères HTML dangereux
    const nomHTML = echapperHTML(nomEspece);
    const lieuHTML = echapperHTML(obs.place_guess || "");

    // Lien vers iNaturalist
    urlObservation = `https://www.inaturalist.org/observations/${obs.id}`;

    // Crée la colonne Bootstrap
    col = document.createElement("div");
    col.className = "col-md-4 col-sm-6";

    // Injection du HTML de la carte (avec Template Literals SÉCURISÉS)
    // Note : On utilise nomHTML et lieuHTML pour l'affichage visuel
    col.innerHTML = `
      <div class="card h-100 shadow-sm ${classeAnimation}">
        <a href="${urlObservation}" target="_blank" rel="noopener noreferrer">
          <img src="${imageSrc}" class="card-img-top espece-img" alt="${nomHTML}">
        </a>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${nomHTML}</h5>
          <p class="card-text text-muted small mb-3">${lieuHTML}</p>
          <div class="d-flex gap-2 mt-auto">
            <button class="${boutonClass} flex-grow-1" onclick="basculerFavori(${i})">
                ${icone} Fav
            </button>
            <button class="btn btn-modern btn-sub" onclick="partagerEspece('${nomSafe}', '${lieuSafe}', ${obs.id})">
                <i class="bi bi-share"></i>
            </button>
          </div>
        </div>
      </div>`;

    // Ajoute la carte au DOM
    CONTAINER_RESULTS.appendChild(col);
  }

  // Restaure le scroll si pas d'animation
  if (!animer) {
    window.scrollTo(0, SCROLL_Y);
  }
}

// --- FAVORIS ---

// Récupère le tableau de favoris du LocalStorage
function getFavoris() {
  const SAVED = localStorage.getItem(STORAGE_FAV_KEY);
  if (SAVED) {
    return JSON.parse(SAVED);
  }
  return []; // Retourne tableau vide si rien
}

// Vérifie si un ID existe dans les favoris
function estDansFavoris(id) {
  const FAVS = getFavoris();
  for (let i = 0; i < FAVS.length; i++) {
    if (FAVS[i].id === id) return true;
  }
  return false;
}

// Ajoute ou supprime un favori (Toggle)
function basculerFavori(index) {
  const ESPECE_CIBLE = dernieresObservations[index];
  const ID = ESPECE_CIBLE.id;
  let favorisActuels = getFavoris();
  let trouve = false;
  let indexAEnlever = -1;

  // Cherche si l'espèce est déjà présente
  // On vérifie d'abord que la liste n'est pas vide pour ne pas faire planter le do...while
  let i = 0;
  if (favorisActuels.length > 0) {
    do {
      if (favorisActuels[i].id === ID) {
        trouve = true;
        indexAEnlever = i;
      }
      i++;
      // La condition d'arrêt gère la sortie :
      // On continue TANT QUE (on n'est pas à la fin) ET (on n'a pas encore trouvé)
    } while (i < favorisActuels.length && !trouve);
  }

  if (trouve) {
    // Si oui, on supprime
    favorisActuels.splice(indexAEnlever, 1);
    if (navigator.vibrate) navigator.vibrate(50);
  } else {
    // Si non, on prépare l'objet
    const NOM = "Inconnu";
    let nomEspece = NOM;
    let imgUrl = "";

    // Extraction des données
    if (ESPECE_CIBLE.taxon) {
      if (ESPECE_CIBLE.taxon.preferred_common_name) {
        nomEspece = ESPECE_CIBLE.taxon.preferred_common_name;
      } else {
        nomEspece = ESPECE_CIBLE.taxon.name;
      }
    }
    if (ESPECE_CIBLE.photos && ESPECE_CIBLE.photos.length > 0) {
      imgUrl = ESPECE_CIBLE.photos[0].url;
    }

    // Création du nouvel objet favori
    const NOUVEAU_FAVORI = {
      id: ID,
      nom: nomEspece,
      image: imgUrl
    };
    // Ajout au tableau
    favorisActuels[favorisActuels.length] = NOUVEAU_FAVORI;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }

  // Sauvegarde la nouvelle liste
  localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(favorisActuels));

  // Met à jour les interfaces
  if (CONTAINER_RESULTS) afficherResultats(dernieresObservations, false);
  if (CONTAINER_FAVORIS) {
    afficherPageFavoris();
    calculerBadges();
  }
  // Gestion spécifique pour la carte (popup)
  if (mapObject) {
    mapObject.closePopup();

    if (trouve) {
      alert("Retiré des favoris");
    } else {
      alert("Ajouté aux favoris !");
    }
  }
}

// Supprime un favori via son index dans le tableau
function supprimerFavori(indexArray) {
  let favorisActuels = getFavoris();
  favorisActuels.splice(indexArray, 1);
  localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(favorisActuels));
  // Rafraîchit l'affichage
  afficherPageFavoris(false);
  calculerBadges();
  if (navigator.vibrate) navigator.vibrate(50);
}

// Génère la page HTML des favoris
function afficherPageFavoris(animer = true) {
  if (!CONTAINER_FAVORIS) return;

  const SCROLL_Y = window.scrollY;
  const FAVS = getFavoris();
  CONTAINER_FAVORIS.innerHTML = "";

  // Gestion affichage message vide
  if (FAVS.length === 0) {
    if (MSG_VIDE) MSG_VIDE.style.display = "block";
    return;
  } else {
    if (MSG_VIDE) MSG_VIDE.style.display = "none";
  }

  let classeAnimation = "";
  if (animer) {
    classeAnimation = "reveal-item";
  }

  let fav, imageSrc, col, urlObservation;

  // Boucle d'affichage des favoris
  for (let i = 0; i < FAVS.length; i++) {
    fav = FAVS[i];
    imageSrc = "https://via.placeholder.com/300?text=Pas+d'image";

    if (fav.image && fav.image !== "") {
      imageSrc = fav.image.replace("square", "medium");
    }

    urlObservation = `https://www.inaturalist.org/observations/${fav.id}`;

    // SÉCURITÉ XSS
    const nomHTML = echapperHTML(fav.nom);

    col = document.createElement("div");
    col.className = "col-md-4 col-sm-6";

    // HTML de la carte favori avec bouton retirer (SÉCURISÉ)
    col.innerHTML = `
      <div class="card h-100 shadow-sm ${classeAnimation}">
        <a href="${urlObservation}" target="_blank" rel="noopener noreferrer">
          <img src="${imageSrc}" class="card-img-top espece-img" alt="${nomHTML}">
        </a>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${nomHTML}</h5>
          <div class="mt-auto">
            <button class="btn btn-remove" onclick="supprimerFavori(${i})">
                <i class="bi bi-trash"></i> Retirer
            </button>
          </div>
        </div>
      </div>`;

    CONTAINER_FAVORIS.appendChild(col);
  }

  if (!animer) {
    window.scrollTo(0, SCROLL_Y);
  }
}

// Calcul des badges selon le nombre de favoris (Gamification)
function calculerBadges() {
  if (!BADGES_CONTAINER) return;

  const NB_FAVS = getFavoris().length;
  let htmlBadges = "";
  let message = "";

  // Logique des paliers : 1, 5, 10, 20 favoris
  // Ajoute l'emoji correspondant (opaque si acquis, transparent sinon)
  if (NB_FAVS >= 1) htmlBadges += '<span title="Débutant">🥚</span> ';
  else htmlBadges += '<span class="opacity-25">🥚</span> ';

  if (NB_FAVS >= 5) htmlBadges += '<span title="Explorateur">🐛</span> ';
  else htmlBadges += '<span class="opacity-25">🐛</span> ';

  if (NB_FAVS >= 10) htmlBadges += '<span title="Expert">🦋</span> ';
  else htmlBadges += '<span class="opacity-25">🦋</span> ';

  if (NB_FAVS >= 20) htmlBadges += '<span title="Légende">🦅</span> ';
  else htmlBadges += '<span class="opacity-25">🦅</span> ';

  // Définit le message d'encouragement pour le prochain palier
  if (NB_FAVS < 1) message = "Ajoutez 1 favori pour obtenir le badge Œuf !";
  else if (NB_FAVS < 5) message = `Encore ${5 - NB_FAVS} pour le badge Chenille !`;
  else if (NB_FAVS < 10) message = `Encore ${10 - NB_FAVS} pour le badge Papillon !`;
  else if (NB_FAVS < 25) message = `Encore ${25 - NB_FAVS} pour le badge Aigle !`;
  else message = "Vous êtes un expert de la biodiversité !";

  // Injecte le HTML et le message
  BADGES_CONTAINER.innerHTML = htmlBadges;
  document.getElementById("next-badge-msg").innerText = message;
}

// Fonction asynchrone pour le partage natif (Web Share API)
async function partagerEspece(nom, lieu, id) {
  const URL_OFFICIELLE = `https://www.inaturalist.org/observations/${id}`;
  const TEXTE = `Regarde cette espèce (${nom}) vue près de ${lieu} !`;

  // Vérifie si le navigateur supporte le partage natif
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'BioQuartier',
        text: TEXTE,
        url: URL_OFFICIELLE
      });
      return;
    } catch (error) {
      console.warn('Erreur partage', error);
    }
  }
  // Fallback : copie dans le presse-papier
  copierDansPressePapier(`${TEXTE} ${URL_OFFICIELLE}`);
}

// --- PLANTNET & CAMERA ---

// Envoie l'image à l'API PlantNet
async function lancerIdentification(file) {
  // Affiche le loader et cache les anciens résultats
  if (LOADING_MSG) LOADING_MSG.classList.remove("d-none");
  if (IDENTIFY_RESULTS) IDENTIFY_RESULTS.innerHTML = "";
  if (BTN_IDENTIFY) BTN_IDENTIFY.classList.add("d-none");

  // Prépare le FormData pour l'upload
  let formData = new FormData();
  formData.append("images", file);
  formData.append("organs", "auto"); // Organe auto-détecté

  try {
    // Requête POST vers PlantNet
    const RESPONSE = await fetch(PLANTNET_API_URL, {
      method: "POST",
      body: formData
    });

    // Gestion erreur HTTP
    if (!RESPONSE.ok) throw new Error(`Erreur PlantNet : ${RESPONSE.status}`);

    // Parse la réponse et affiche
    const DATA = await RESPONSE.json();
    afficherResultatsPlantNet(DATA.results);

  } catch (error) {
    console.error(error);
    // Affiche erreur et réactive le bouton
    if (IDENTIFY_RESULTS) IDENTIFY_RESULTS.innerHTML = '<div class="alert alert-danger">Erreur lors de l\'analyse.</div>';
    if (BTN_IDENTIFY) BTN_IDENTIFY.classList.remove("d-none");
  } finally {
    // Cache le loader quoi qu'il arrive
    if (LOADING_MSG) LOADING_MSG.classList.add("d-none");
  }
}

// Affiche les résultats de l'identification
function afficherResultatsPlantNet(results) {
  if (!IDENTIFY_RESULTS) return;

  // Si pas de résultats, alerte
  if (!results || results.length === 0) {
    IDENTIFY_RESULTS.innerHTML = '<div class="alert alert-warning">Aucune plante reconnue.</div>';
    return;
  }

  // Limite aux 3 meilleurs résultats
  const LIMIT = 3;
  let max = results.length;
  if (max > LIMIT) {
    max = LIMIT;
  }

  let plant, score, nomSci, nomCom, col;

  for (let i = 0; i < max; i++) {
    plant = results[i];
    // Score en pourcentage
    score = (plant.score * 100).toFixed(1);
    nomSci = plant.species.scientificNameWithoutAuthor;
    nomCom = nomSci;
    // Utilise le nom commun si dispo
    if (plant.species.commonNames && plant.species.commonNames.length > 0) {
      nomCom = plant.species.commonNames[0];
    }

    col = document.createElement("div");
    col.className = "col-12";

    const NOM_COM_SAFE = nomCom.replace(REGEX_APOSTROPHE, "\\'");

    // SÉCURITÉ XSS
    const nomHTML = echapperHTML(nomCom);
    const nomSciHTML = echapperHTML(nomSci);

    // HTML avec bouton "Ajouter au carnet" (SÉCURISÉ)
    col.innerHTML = `
      <div class="card shadow-sm border-success mb-2 reveal-item">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="card-title text-success mb-1">${nomHTML}</h5>
              <p class="card-text text-muted small mb-2"><i>${nomSciHTML}</i></p>
            </div>
            <span class="badge bg-success">${score}%</span>
          </div>
          <div class="progress mb-3" style="height: 6px;">
            <div class="progress-bar bg-success" style="width: ${score}%"></div>
          </div>
          <button class="btn btn-modern btn-main w-100"
            onclick="ajouterAuCarnet('${NOM_COM_SAFE}', '${nomSci}', imageBase64Stockable)">
            <i class="bi bi-journal-plus"></i> Ajouter au Herbier
          </button>
        </div>
      </div>`;
    IDENTIFY_RESULTS.appendChild(col);
  }

  // Bouton pour recommencer
  let btnReset = document.createElement("div");
  btnReset.className = "text-center mt-3";
  btnReset.innerHTML = `
    <button class="btn btn-modern btn-sub" onclick="location.reload()">
        <i class="bi bi-arrow-clockwise"></i> Nouvelle photo
    </button>`;

  IDENTIFY_RESULTS.appendChild(btnReset);
}

// --- BIO-DEX (CARNET) ---

// Récupère le carnet du LocalStorage
function getDex() {
  const SAVED = localStorage.getItem(STORAGE_DEX_KEY);
  if (SAVED) {
    return JSON.parse(SAVED);
  }
  return [];
}

// Ajoute une nouvelle plante au carnet
async function ajouterAuCarnet(nom, nomSci, imageSrc) {
  let dex = getDex();

  // Vérifie doublon via nom scientifique
  let existeDeja = null;
  let i = 0;

  if (dex.length > 0) {
    do {
      // Si on trouve le nom scientifique, on stocke l'objet
      if (dex[i].nomSci === nomSci) {
        existeDeja = dex[i];
      }
      i++;
      // La boucle continue tant qu'on n'est pas à la fin
      // ET qu'on n'a pas encore trouvé (existeDeja est encore null)
    } while (i < dex.length && existeDeja === null);
  }

  if (existeDeja) {
    alert("Vous avez déjà cette plante !");
    return;
  }

  // ID unique basé sur le timestamp
  const ID_UNIQUE = Date.now();

  // Sauvegarde l'image dans le Cache API (lourd)
  await saveImageToCache(ID_UNIQUE, imageSrc);

  // Objet métadonnées (léger)
  const NOUVELLE_DECOUVERTE = {
    id: ID_UNIQUE,
    nom: nom,
    nomSci: nomSci,
    hasImage: true,
    categorie: "Plantae",
    date: new Date().toLocaleDateString("fr-FR")
  };

  // Ajoute au début du tableau (Spread Operator)
  dex = [NOUVELLE_DECOUVERTE, ...dex];

  // Sauvegarde JSON
  localStorage.setItem(STORAGE_DEX_KEY, JSON.stringify(dex));

  if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
  alert(`${nom} ajouté à votre Herbier !`);

  // Redirection
  window.location.href = "carnet.html";
}

// Affiche la liste des plantes du carnet
async function afficherCarnet() {
  if (!CONTAINER_DEX) return;
  const DEX = getDex();
  // Met à jour la barre de progression
  updateDexStats(DEX);

  CONTAINER_DEX.innerHTML = "";
  // Gestion vide
  if (DEX.length === 0) {
    if (DEX_EMPTY) DEX_EMPTY.classList.remove("d-none");
    return;
  }

  let item, badgeColor, col, imgSrc;

  // Boucle d'affichage
  for (let i = 0; i < DEX.length; i++) {
    item = DEX[i];
    badgeColor = "bg-success";
    imgSrc = "https://via.placeholder.com/300?text=Chargement...";

    // Récupère l'image depuis le cache
    if (item.hasImage) {
      const URL_CACHE = await getImageFromCache(item.id);
      if (URL_CACHE) imgSrc = URL_CACHE;
    } else if (item.image) {
      imgSrc = item.image;
    }

    col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3 reveal-item";

    // SÉCURITÉ XSS
    const nomHTML = echapperHTML(item.nom);
    const nomSciHTML = echapperHTML(item.nomSci);

    // HTML de la carte carnet avec date et bouton supprimer (SÉCURISÉ)
    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0">
        <div class="position-relative">
          <img src="${imgSrc}" class="card-img-top" style="height: 150px; object-fit: cover;" alt="${nomHTML}">
          <span class="position-absolute top-0 end-0 badge ${badgeColor} m-2 shadow-sm">${item.categorie}</span>
        </div>
        <div class="card-body p-3">
          <h6 class="card-title mb-1 text-truncate">${nomHTML}</h6>
          <p class="text-muted small fst-italic mb-2 text-truncate">${nomSciHTML}</p>
          <p class="text-muted small mb-0" style="font-size: 0.75rem"><i class="bi bi-calendar-event"></i> ${item.date}</p>
        </div>
        <div class="p-2">
            <button class="btn btn-remove btn-sm" onclick="supprimerDuCarnet(${item.id})">
                <i class="bi bi-trash"></i> Supprimer
            </button>
        </div>
      </div>`;
    CONTAINER_DEX.appendChild(col);
  }
}

// Supprime une plante du carnet et son image du cache
async function supprimerDuCarnet(id) {
  if (!confirm("Supprimer cette découverte ?")) return;

  let dex = getDex();
  let nouveauDex = [];
  // Filtre pour retirer l'élément
  for (let i = 0; i < dex.length; i++) {
    if (dex[i].id !== id) {
      nouveauDex[nouveauDex.length] = dex[i];
    }
  }
  dex = nouveauDex;

  localStorage.setItem(STORAGE_DEX_KEY, JSON.stringify(dex));

  // Supprime l'image du Cache API
  await deleteImageFromCache(id);

  // Rafraîchit
  afficherCarnet();
}

// Met à jour les stats du carnet (titre, progression)
function updateDexStats(dex) {
  const COUNT = dex.length;

  if (!RANK_TITLE || !RANK_PROGRESS) return;

  TOTAL_COUNT.innerText = COUNT;

  let rankName = "Graine 🌱";
  let nextGoal = 5;
  let progressPercent = 0;
  let message = "";

  // Logique de progression par paliers
  if (COUNT < 5) {
    rankName = "Graine 🌱";
    nextGoal = 5;
    progressPercent = (COUNT / 5) * 100;
    message = `Encore ${5 - COUNT} plantes pour devenir une Pousse !`;
  } else if (COUNT < 10) {
    rankName = "Pousse Vigoureuse 🌿";
    nextGoal = 10;
    progressPercent = (COUNT / 10) * 100;
    message = `Encore ${10 - COUNT} plantes pour fleurir !`;
  } else if (COUNT < 20) {
    rankName = "Fleur Épanouie 🌸";
    nextGoal = 20;
    progressPercent = (COUNT / 20) * 100;
    message = `Encore ${20 - COUNT} plantes pour devenir un Arbre !`;
  } else {
    rankName = "Arbre Vénérable 🌳";
    progressPercent = 100;
    message = "Vous êtes un maître botaniste !";
  }

  // Mise à jour du DOM
  RANK_TITLE.innerText = rankName;
  RANK_PROGRESS.style.width = `${progressPercent}%`;
  RANK_NEXT_MSG.innerText = message;
}