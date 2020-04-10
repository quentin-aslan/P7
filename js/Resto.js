class Resto {
    /**
     * 
     * @param {String} placeId GoogleId du restaurant
     * @param {String} name Nom du restaurants
     * @param {String} address Adresse du restaurant
     * @param {Object} pos Position du restaurant
     * @param {Integer} starsAverage Note moyenne du restaurant
     */
    constructor(placeId, name, address, pos, starsAverage) {
        this.setPlaceId(placeId);
        this.setName(name);
        this.setAddress(address);
        this.setPos(pos);
        this.setStarsAverage(starsAverage);

        this.apiReviews = false;
        this.reviews = [];
    }

    setPlaceId(placeId) {
        this.placeId = placeId;
    }

    setName(name) {
        this.name = name;
    }

    setAddress(address) {
        this.address = address;
    }

    setPos(pos) {
        this.position = {
            lat: pos.lat,
            lng: pos.lng
        };
    }

    setStarsAverage(starsAverage) {
        this.starsAverage = starsAverage;
    }

    /**
     * On passe à true si les avis ont été chargé
     * @param {Boolean} bool 
     */
    setApiReview(bool) {
        if(typeof bool == "boolean") this.apiReviews = bool;
    }

    /**
     * @return GoogleId du restaurant
     */
    getPlaceId() {
        return this.placeId;
    }

    /**
     * @return Position du restaurant
     */
    getPos() {
        return this.position;
    }

    /**
     * @return Nom du restaurant
     */
    getName() {
        return this.name;
    }

    /**
     * @return Adresse du restaurant
     */
    getAddress() {
        return this.address;
    }

    /**
     * @return Note moyenne du restaurant
     */
    getStarsAverage() {
        return this.starsAverage;
    }

    /**
     * @return Valeur d'apiReview (Indique si les avis ont déja été chargé ou non.)
     */
    getApiReviews() {
        return this.apiReviews;
    }

    /**
     * @description Ajoute un avis au restaurant
     * @param {Object} review 
     */
    addReview(review) {
        if (typeof review == "object") this.reviews.push(review);
    }

    /**
     * @return Liste des avis du restaurants
     */
    getReviews() {
        return this.reviews;
    }


}