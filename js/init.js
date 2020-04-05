var map;
var geocoder;
var place;
var autocomplete;
/**
 * @description Lors du chargement de l'API, on lui passe la fonction en parametre de callback donc lorsque l'api de google est chargé, on charge tout le reste.
 */
function initMap() {
    fixeDisplay();

  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8
  });

  geocoder = new google.maps.Geocoder;
  place = new google.maps.places.PlacesService(map);
  checkGeo();
  mapListener(map);
  getAutocomplete();
}

/**
 * @description Initialise l'autocompletion pour que l'utilisateur ai une aide lors de sa recherche d'adresse
 */
function getAutocomplete() {
  let input = document.getElementById('search');
  console.log(input);
  const options = {
    bounds:ENV.currentPos,
    types:['geocode']
  };

  autocomplete = new google.maps.places.Autocomplete(input, options);
  autocomplete.setFields(['address_component']);

}

/**
 * @description mets en place les listeners pour attraper les events
 */
function mapListener() {
  // Lorsqu'un utilisateur clique sur la map
  map.addListener('click', (e) => {
    const pos = e.latLng;
    findAddress(pos); // On affiche l'adresse

    $('#add_pos').val(JSON.stringify({lat:pos.lat(), lng: pos.lng()})); // On envoie les coordonées en JSON.
    $('#modalAdd').modal('toggle'); // On affiche la modal pour qu'il renplisse les informations
  });

  // Lorsque l'utilisateur se déplace sur la carte, charger les restos au fur et à mesure
  map.addListener('dragend', function(){
    ENV.currentPos = map.getCenter();
    findAddress(ENV.currentPos); // On récupère l'adresse
    getNearbyPlace(ENV.currentPos, () => {
      filters();
    });
});

}

/**
 * @description On vérifie que la geolocalisation est activé sur le navigateur
 */
function checkGeo() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      ENV.currentPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setZoom(ENV.currentPos);
      getNearbyPlace(ENV.currentPos, () => {
        filters();
      });

      findAddress(ENV.currentPos); // On affiche l'addresse dans la barre de recherche
  
      const marker = new google.maps.Marker({
        position: ENV.currentPos,
        map: map,
        title: 'Vous êtes ici !',
        icon: 'http://maps.google.com/mapfiles/arrow.png'
      });
  
    });
  
  }
}

/**
 * @description fixe la hauteur de la carte et la hauteur de la liste des restaurants
 */
function fixeDisplay() {
  var heightNavigateur = window.innerHeight;
  let heightNavbar = $('nav').css('height');
  heightMap = parseInt(heightNavigateur)-parseInt(heightNavbar);

  let heightChangeRadius = $('#changeRadius').css('height');
  heightListResto = parseInt(heightMap)-parseInt(heightChangeRadius);
  $('#listRestos').css('height', heightListResto);
  $('#map').css('height', heightMap);
}