const Markers = [];
/**
 * @description Ajouter un marker sur la carte
 * @param {Object} markerPosition lat,lng
 * @param {String} label 
 * @param {String} title 
 * @param {String} icon 
 */
function addMarker(pos, title, icon, id) {
    const marker = new google.maps.Marker({
        position: pos,
        title: title,
        map: map,
        icon: icon
    });
    Markers.push(marker);
    // A chaque click on ouvre le collapsible correspondant
    marker.addListener('click', function () {

        //Animation JQuery
        $("#listRestos").stop().animate( { scrollTop: $(`#${id}_head`).offset().top-150 }, 1500);
        $(`#C${id}_collapse`).collapse('toggle');
        displayReview(RESTOS[id].placeId);

        map.setCenter(pos);
        map.setZoom(14);
    });
}

/**
 * @description Supprime tous les markers de la map.
 */
function clearMarker() {
    for(let iMarker = 0; iMarker<Markers.length; iMarker++) {
        Markers[iMarker].setMap(null);
    }
}

/**
 * @description Centre la caméra sur des coordonnées
 * @param {Object} pos position
 */
function setZoom(pos) {
    map.setCenter(pos);
    map.setZoom(14);
}

/**
 * @description Récupére une adresse depuis des coordonées
 * @param {Object} pos 
 */
function findAddress(pos) {
    geocoder.geocode({ 'location': pos }, function (results, status) {
        if (status === 'OK') {
            if (results[0]) {
                // On remplie automatiquement le champs addresse du formulaire et le champs de recherche
                $('#add_address').val(results[0].formatted_address);
                $('#search').val(results[0].formatted_address);
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}

/**
 * @description Récupére des coordonnées depuis une address
 * @param {Object} pos 
 */
function findPosition(address) {
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === 'OK') {
            if (results[0]) {

                ENV.currentPos = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                }

                // On centre la map sur l'address
                map.setCenter(ENV.currentPos);
                map.setZoom(14);

                getNearbyPlace(ENV.currentPos, () => {
                    filters();
                });

            }
        } else {
            alert('Cette adresse n\'a pas été trouvé !')
        }
    });
}

let Circle;
function clearCircle() {
    if(typeof Circle == "object")  {
        Circle.setMap(null);
    }
}

function displayCircle(pos, radius)  {
    clearCircle();
    Circle = new google.maps.Circle({
        strokeColor: '#000000',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: '#C9BABA',
        fillOpacity: 0.35,
        map: map,
        center: pos,
        radius
      });
}

/**
 * @description Récupère les restaurants proche de la position de l'utilisateur
 * @param {Object} pos 
 * @param {Callback} callback
 */
function getNearbyPlace(pos, callback) {
    // A chaque nouvelle requête, on supprime les anciens restaurants

    RESTOS.splice(0, RESTOS.length);

    const request = {
        location: pos,
        radius: ENV.nearbySearch,
        type: ['restaurant']
    };
    console.log(ENV.nearbySearch);
    console.log(request);

    place.nearbySearch(request, (res, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            // Pour chaque restaurants, on récupère toute ses informations et on ajoute dans dans la liste des RESTOS.
            for (let nbResto = 0; nbResto < res.length; nbResto++) {
                const restoGoogle = res[nbResto];

                // On crée un objet avec les informations du restaurant
                const resto = {
                    placeId: restoGoogle.place_id,
                    restaurantName: restoGoogle.name,
                    address: restoGoogle.vicinity,
                    lat: restoGoogle.geometry.location.lat(),
                    long: restoGoogle.geometry.location.lng(),
                    starsAverage: restoGoogle.rating,
                    ratings: []
                };
                RESTOS.push(resto);
            }
        }
        callback();

    });
}

/**
 * @description Récupère les avis d'un restaurants avec l'api google place et les ajoutents à RESTOS
 * @param {String} placeId 
 * @param {Callback} callback 
 */
function getReview(placeId, callback) {

        const resto = RESTOS.find((e) => e.placeId == placeId);

        // Si les avis du restaurants ne sont pas charger
        if(!resto.getReview) {

        const requestDetails = {
            placeId,
            fields: ['review']
        };

        place.getDetails(requestDetails, (place, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (let nbReview = 0; nbReview < place.reviews.length; nbReview++) {
                    const ratingGoogle = place.reviews[nbReview];
                    const rating = {
                        stars: ratingGoogle.rating,
                        comment: ratingGoogle.text
                    };
                    resto.ratings.push(rating);
                }
            }
            resto.getReview = true; // On lui ajoute un attributs qui nous permet de vérifier si il à déja charger les avis
            callback();
        });
        } else callback();

}