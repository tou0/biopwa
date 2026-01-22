/**
 * CONSTANTES DE CONFIGURATION
 */
const API_BASE_URL = "https://api.inaturalist.org/v1/observations";
const STORAGE_POS_KEY = "BIOQUARTIER_LAST_POS";
const STORAGE_FAV_KEY = "BIOQUARTIER_FAVORIS";
const STORAGE_RESULTS_KEY = "BIOQUARTIER_LAST_RESULTS";
const STORAGE_DEX_KEY = "BIOQUARTIER_DEX";
const REGEX_APOSTROPHE = /'/g;
const MAX_RESULTS = 50;
const CACHE_NAME_USER = "bioquartier-user-images";
const DEFAULT_LAT = 46.603354;
const DEFAULT_LNG = 1.888334;
const DEFAULT_ZOOM = 5;
const ZOOM_LEVEL = 13;
const PLANTNET_API_KEY = "2b10N8ocUgjoS5ROpcbnN5OO";  // Don't steal it lol, it's free for public use :)
const PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all?api-key=" + PLANTNET_API_KEY;

/**
 * VARIABLES GLOBALES (État de l'application)
 */
let dernieresObservations = [];
let currentRadius = 1;
let currentTaxa = "";
let mapObject = null;
let mapMarkers = [];
let eggClickCount = 0;
let currentLat = null;
let currentLng = null;
let selectedFile = null;
let imageBase64Stockable = null;

/**
 * ÉLÉMENTS DU DOM
 */
const BTN_LOCATE = document.getElementById("btn-locate");
const CONTAINER_RESULTS = document.getElementById("results-container");
const STATUS_MSG = document.getElementById("status-msg");
const CONTAINER_FAVORIS = document.getElementById("favorites-container");
const MSG_VIDE = document.getElementById("msg-vide");
const SLIDER_RADIUS = document.getElementById("radius-slider");
const LABEL_RADIUS = document.getElementById("radius-value");
const FILTERS_CONTAINER = document.getElementById("filters-container");
const BADGES_CONTAINER = document.getElementById("badges-container");
const INPUT_CAMERA = document.getElementById("input-camera");
const PREVIEW_IMAGE = document.getElementById("preview-image");
const BTN_IDENTIFY = document.getElementById("btn-identify");
const CONTAINER_DEX = document.getElementById("dex-container");
const LOADING_MSG = document.getElementById("loading-msg");
const IDENTIFY_RESULTS = document.getElementById("identify-results");
const DEX_EMPTY = document.getElementById("dex-empty");
const RANK_TITLE = document.getElementById("rank-title");
const RANK_PROGRESS = document.getElementById("rank-progress");
const RANK_NEXT_MSG = document.getElementById("rank-next-msg");
const TOTAL_COUNT = document.getElementById("total-count");
