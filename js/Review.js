class Review {
    /**
     * @description Instance d'un avis sur un restaurant
     * @param {String} coment Commentaire de l'avis
     * @param {Float} stars Note de l'avis
     */
    constructor(coment, stars) {
        this.setComent(coment);
        this.setStars(stars);
    }

    /**
     * @description Modifie le commentaire de l'avis
     * @param {String} coment 
     */
    setComent(coment) {
        if(coment) this.coment = coment;
    }

    /**
     * @description Modifie la note de l'avis
     * @param {Float} stars 
     */
    setStars(stars) {
        this.stars = parseInt(stars);
    }

    /**
     * @return Commentaire de l'avis
     */
    getComent() {
        return this.coment;
    }


    /**
     * @return Note de l'avis
     */
    getStars() {
        return this.stars;
    }

}