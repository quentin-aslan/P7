class MapG {
    /**
     * @class MapG (Map est pris par google)
     * @description Intérargie avec l'API de GoogleMap & avec les éléments de l'IHM (Map et Liste)
     */
    constructor() {
        this.api = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -34.397, lng: 150.644 },
            zoom: 8,
        });

        this.markers = [];
        this.restos = []; 
        this.geocoder = new google.maps.Geocoder;
        this.place = new google.maps.places.PlacesService(this.api);
        this.currentPos = {};
        this.circle;
        this.nearbySearch = 1000;

        this.checkGeo(() => {
            this.mapListeners();
            this.IHMlisteners();
            this.getAutocomplete();
        });

    }

    // --- GETTERS ---

    /**
     * @return Position courante
     */
    getCurrentPos() {
        return this.currentPos;
    }

    /**
     * @return Rayon de recherche des restaurants
     */
    getNearbySearch() {
        return this.nearbySearch;
    }

    // --- SETTERS ---

    /**
     * @description Modifier la position courante.
     * @param {String} lat 
     * @param {String} lng 
     */
    setCurrentPos(lat, lng) {
        this.currentPos.lat = lat;
        this.currentPos.lng = lng;
    }

    /**
     * @description Modifie le rayon de recherche des restaurants
     * @param {Integer} val 
     */
    setNearbySearch(val) {
        this.nearbySearch = parseInt(val);
    }


    /**
     * @description On vérifie que la geolocalisation est activé sur le navigateur
     * @param {Callback} callback 
     */ 
    checkGeo(callback) {
        // Car this, deviens l'objet geolocation
        const MapG = this;
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                MapG.setCurrentPos(position.coords.latitude, position.coords.longitude);
                MapG.setZoom(MapG.getCurrentPos());

                MapG.getNearbyPlace(MapG.getCurrentPos(), () => {
                    MapG.displayRestos();
                });
                MapG.findAddress(MapG.getCurrentPos()); // On affiche l'addresse dans la barre de recherche

                MapG.addMarker(MapG.getCurrentPos(), 'Vous êtes ici !', 'http://maps.google.com/mapfiles/arrow.png', -1)
                callback();
            });

        }
    }


    /**
     * @description Ajouter un marker sur la carte
     * @param {Object} position lat,lng
     * @param {String} label 
     * @param {String} title 
     * @param {String} icon 
     */
    addMarker(position, title, icon, id) {
        const marker = new google.maps.Marker({
            position,
            title,
            map: this.api,
            icon: icon,
            id: id
        });
        this.markers.push(marker);

        // A chaque click on affiche les informations du restaurants
        if (id != null) {
            const MapG = this;
            marker.addListener('click', function () {
                //Animation JQuery
                $("#listRestos").stop().animate({ scrollTop: $(`#${id}_head`).offset().top - 150 }, 1500);
                $("html, body").stop().animate({ scrollTop: $(`#${id}_head`).offset().top - 150 }, 1500);
                $(`#C${id}_collapse`).collapse('toggle');
                MapG.displayReview(MapG.restos[id].getPlaceId());

                MapG.setZoom(position);
            });
        }
    }

    /**
     * @description Supprime tous les markers de la map.
     */
    clearMarker() {
        for (let iMarker = 0; iMarker < this.markers.length; iMarker++) {
            if(this.markers[iMarker].id != -1)  this.markers[iMarker].setMap(null);
        }
    }

    /**
     * @description Centre la caméra sur des coordonnées
     * @param {Object} position position
     */
    setZoom(position) {
        this.api.setCenter(position);
        this.api.setZoom(17);
    }

    /**
     * @description Récupére une adresse depuis des coordonées
     * @param {Object} position
     */
    findAddress(position) {
        this.geocoder.geocode({ 'location': position }, function (results, status) {
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
     * @param {Object} address 
     */
    findPosition(address) {
        // Car this, deviens l'objet geolocation
        const MapG = this;
        MapG.geocoder.geocode({ 'address': address }, function (results, status) {
            if (status === 'OK') {
                if (results[0]) {

                    MapG.setCurrentPos(results[0].geometry.location.lat(), results[0].geometry.location.lng());

                    // On centre la map sur l'address
                    MapG.setZoom(MapG.getCurrentPos());

                    MapG.getNearbyPlace(MapG.getCurrentPos(), () => {
                        MapG.displayRestos();
                    });

                }
            } else {
                alert('Cette adresse n\'a pas été trouvé !')
            }
        });
    }

    /**
     * @description Enlève le cercle de la map
     */
    hideCircle() {
        if (typeof this.circle == "object") {
            this.circle.setMap(null);
        }
    }

    /**
     * @description Affiche un cercle qui correspond à l'emplacement de recherche des restaurants
     * @param {Object} position Centre du cercle
     * @param {Integer} radius Rayon du cercle
     */
    displayCircle(position, radius) {
        this.hideCircle();
        this.circle = new google.maps.Circle({
            strokeColor: '#000000',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: '#C9BABA',
            fillOpacity: 0.35,
            map: this.api,
            center: position,
            radius
        });
    }

    /**
     * @description Récupère les restaurants proche de la position de l'utilisateur
     * @param {Object} position 
     * @param {Callback} callback
     */
    getNearbyPlace(position, callback) {
        // A chaque nouvelle requête, on supprime les anciens restaurants

        this.restos.splice(0, this.restos.length);

        const request = {
            location: position,
            radius: this.getNearbySearch(),
            type: ['restaurant']
        };

        this.place.nearbySearch(request, (res, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // Pour chaque restaurants, on récupère toute ses informations et on ajoute dans dans la liste des RESTOS.
                for (let nbResto = 0; nbResto < res.length; nbResto++) {
                    const restoGoogle = res[nbResto];

                    // On créer une nouvelle instance d'un resto et on l'envoie dans la liste des resto
                    const restoPos = {
                        lat: restoGoogle.geometry.location.lat(),
                        lng: restoGoogle.geometry.location.lng()
                    };
                    const resto = new Resto(restoGoogle.place_id, restoGoogle.name, restoGoogle.vicinity, restoPos, restoGoogle.rating);
                    this.restos.push(resto);
                }
            }
            callback();
        });
    }

    /**
     * @description Récupère les avis d'un restaurants avec l'api google place et les ajoutents à la liste des restos
     * @param {String} placeId 
     * @param {Callback} callback 
     */
    getReview(placeId, callback) {

        const resto = this.restos.find((e) => e.placeId == placeId);

        // Si les avis du restaurants ne sont pas chargé
        if (!resto.getApiReviews()) {

            const requestDetails = {
                placeId,
                fields: ['review']
            };

            this.place.getDetails(requestDetails, (place, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (let nbReview = 0; nbReview < place.reviews.length; nbReview++) {
                        const reviewGoogle = place.reviews[nbReview];

                        const review = new Review(reviewGoogle.text, reviewGoogle.rating);
                        resto.addReview(review);
                    }
                }
                resto.setApiReview(true); // On lui ajoute un attributs qui nous permet de vérifier si il à déja charger les avis
                callback();
            });
        } else callback();

    }

    // --- IHM ---

    /**
     * @description Affiche les restaurants sur la liste et sur la map
     */
    displayRestos() {
        this.clearMarker(); // On commence par enlever tout les markers de la map

        // On récupère les valeurs des filtres que l'utilisateurs à choisi
        let min = $('#filterStarsMin').val();
        let max = $('#filterStarsMax').val();

        const ul = $('#accordion');
        ul.html('');
        // Variable global, fichier JSON
        let indice = 0;
        this.restos.forEach(resto => {
            const starsAverage = resto.getStarsAverage();
            // Si le restaurants respecte le filtre choisi par l'utilisateur alors on l'affiche sur la carte et sur la liste !
            if (starsAverage <= max && starsAverage >= min) {

                // On ajoute un marker sur la carte
                const pos = resto.getPos();
                this.addMarker(pos, resto.getName(), 'http://maps.google.com/mapfiles/kml/pal2/icon32.png', indice);

                // IHM
                const restoElmt = `
                    <div class="card">
                        <div class="card-header" id="${indice}_head">
                            <h5 class="mb-0">
                                <button class="btn btn-link collapsed" data-toggle="collapse" data-target="#C${indice}_collapse"
                                    aria-expanded="false" aria-controls="C${indice}_collapse">
                                ${resto.getName()} - <span id="${indice}_starsAverage">${starsAverage.toFixed(1)}</span>
                                </button>
                            </h5>
                        </div>
            
                        <div id="C${indice}_collapse" class="collapse" aria-labelledby="${indice}_head" data-parent="#accordion">
                            <div class="card-body">
                            <strong>${resto.getAddress()}</strong>
            
                            <ul id="${indice}_listReview"></ul>
            
                            <div class="text-center">
                                <button type="button" class="btn btn-primary btn-smb btnReview" id="${indice}_Review">Ajouter un avis</button>
                                <br />
                            <img src="https://maps.googleapis.com/maps/api/streetview?size=300x200&location=${pos.lat},${pos.lng}&key=AIzaSyDpjNJBnVR1r9vARnI05aoDxPSLdThd8_w">
                            </div>
                            </div>
                        </div>
                    </div>`;
                ul.append(restoElmt);

                // Listener pour zoom sur le resto
                $(`#${indice}_head`).click((e) => {
                    this.setZoom(pos);
                    this.displayReview(resto.getPlaceId());
                });

                // Listener pour ajouer un Review
                $(`#${indice}_Review`).click((e) => {
                    $('#Review_name').html(resto.getName());
                    $('#Review_address').html(resto.getAddress());
                    $('#modalReview').modal('toggle');
                });

            }
            indice++; // on incrémente l'indice (correspond à l'id)
        });
    }

    /**
     * @description Affiche les avis d'un restaurants lorsque l'utilisateur le séléctionne
     * @param {String} placeId 
     */
    displayReview(placeId) {
        const resto = this.restos.find((e) => e.getPlaceId() == placeId);
        const indice = this.restos.indexOf(resto);

        $(`#${indice}_listReview`).html('<li class="text-danger">Chargement des avis ...</li>');
        this.getReview(placeId, () => {
            let ulComment = ''; // Liste des commentaire afficher sur l'IHM
            this.restos[indice].getReviews().forEach(review => {
                ulComment += `<li>${review.getStars().toFixed(1)} - <small> ${review.getComent()}</small></li>`;
            });

            $(`#${indice}_listReview`).html(ulComment);
        });
    }

    /**
     * @description Tout les listeners de la carte & la liste des restos
     */
    IHMlisteners() {
        // Lorsque l'utilisateur veut effecter une recherche en fonction des étoiles des RESTOS.
        $('.changeFilters').change((e) => {
            this.displayRestos();
        });

        // Lorsqu'il modifie la valeur du cercle mais qu'il n'a pas encore appuyer sur rechercher, je lui affiche un cercle d'information
        $('#radius').change((e) => {
            this.setNearbySearch($('#radius').val());
            this.displayCircle(this.getCurrentPos(), this.getNearbySearch());
        });

        // Lorsque l'utilisateur change le rayon de recherche
        $('#sendChangeRadius').click((e) => {
            e.preventDefault();
            this.setNearbySearch($('#radius').val());
            this.hideCircle();
            this.getNearbyPlace(this.getCurrentPos(), () => {
                this.displayRestos();
            });
        });

        // Lorsqu'il recherche un resto avec une adresse
        $('#sendSearch').click((e) => {
            e.preventDefault();
            let address = $('#search').val();

            if (!address) alert('Vous devez rentrer une adresse valide !');
            else {
                this.findPosition(address);
            }

        });

        // --- Add Review ---
        $('#Review_send').click((e) => {
            e.preventDefault();
            const name = $('#Review_name').html();
            let coment = $('#Review_comment').val();
            const stars = parseInt($('#Review_stars').attr('rating'));

            if (!coment) alert('Vous devez rentrer un commentaire !');
            else {
                const review = new Review(coment, stars);

                const resto = this.restos.find((e) => e.getName() == name);
                resto.addReview(review);

                // On clear le comment et on fait disparraitre la modal
                $('#Review_comment').val('');
                $('#modalReview').modal('toggle');

                this.displayRestos(); // On actualise les resto en fonction des filtre choisi par l'utilisateur

                // On affiche le restaurant
                const indice = this.restos.indexOf(resto);
                $(`#C${indice}_collapse`).collapse('toggle');
                this.displayReview(this.restos[indice].getPlaceId());

            }

        });

        // --- ADD RESTO ---
        $('#add_send').click((e) => {
            e.preventDefault();
            let name = $('#add_name').val();
            let coment = $('#add_comment').val();
            const stars = parseInt($('#add_stars').attr('rating'));
            const address = $('#add_address').val();
            let pos = $('#add_pos').val();
            pos = JSON.parse(pos);

            if (!name) alert('Vous devez rentrer un nom pour le restaurant !');
            else if (!coment) alert('Vous devez rentrer un commentaire !');
            else {
                const resto = new Resto(null, name, address, pos, stars);
                resto.setApiReview(true);

                const review = new Review(coment, stars);
                resto.addReview(review);

                this.restos.push(resto);

                const indice = this.restos.indexOf(resto);
                this.restos[indice].setPlaceId(indice);

                // On clear les champs et on fait disparraitre la modal
                $('#add_name').val('');
                $('#add_comment').val('');
                $('#modalAdd').modal('toggle');


                // On affiche le restaurant et ses avis et on zoom sur la carte
                this.setZoom(pos);
                this.displayRestos();
                $(`#C${indice}_collapse`).collapse('toggle');
                this.displayReview(indice);

            }

        });

    }

    /**
     * @description mets en place les listeners pour attraper les events
     */
    mapListeners() {

        const MapG = this;

        // Lorsqu'un utilisateur clique sur la map
        MapG.api.addListener('click', (e) => {
            const pos = e.latLng;
            MapG.findAddress(pos); // On affiche l'adresse

            $('#add_pos').val(JSON.stringify({ lat: pos.lat(), lng: pos.lng() })); // On envoie les coordonées en JSON.
            $('#modalAdd').modal('toggle'); // On affiche la modal pour qu'il renplisse les informations
        });

        // Lorsque l'utilisateur se déplace sur la carte, charger les restos au fur et à mesure
        MapG.api.addListener('dragend', function () {
            MapG.setCurrentPos(MapG.api.getCenter().lat(), MapG.api.getCenter().lng());
            MapG.findAddress(MapG.getCurrentPos()); // On récupère l'adresse
            MapG.getNearbyPlace(MapG.getCurrentPos(), () => {
                MapG.displayRestos();
            });
        });

        }

    /**
     * @description Initialise l'autocompletion pour que l'utilisateur ai une aide lors de sa recherche d'adresse
     */
    getAutocomplete() {
        let input = document.getElementById('search');
        const options = {
            // bounds: this.getCurrentPos(),
            types: ['geocode']
        };

        let autocomplete = new google.maps.places.Autocomplete(input, options);
        autocomplete.setFields(['address_component']);

    }

}