/**
 * Affiche les restaurants sur la liste et sur l'IHM
 * @param {Integer} min Nombre d'étoile minimum
 * @param {Integer} max Nombre d'étoile max
 */
function displayResto(min, max) {
  clearMarker(); // On commence par enlever tout les markers de la map
  const ul = $('#accordion');
  ul.html('');
  // Variable global, fichier JSON
  let indice = 0;
  RESTOS.forEach(resto => {
    const starsAverage = resto.starsAverage;
    // Si le restaurants respecte le filtre choisi par l'utilisateur alors on l'affiche sur la carte et sur la liste !
    if (starsAverage <= max && starsAverage >= min) {

      // On ajoute un marker sur la carte
      const pos = {
        lat: resto.lat,
        lng: resto.long
      };
      addMarker(pos, resto.restaurantName, 'http://maps.google.com/mapfiles/kml/pal2/icon32.png', indice);
      // IHM
      const restoElmt = `
        <div class="card">
          <div class="card-header" id="${indice}_head">
              <h5 class="mb-0">
                  <button class="btn btn-link collapsed" data-toggle="collapse" data-target="#C${indice}_collapse"
                      aria-expanded="false" aria-controls="C${indice}_collapse">
                    ${resto.restaurantName} - <span id="${indice}_starsAverage">${starsAverage.toFixed(1)}</span>
                  </button>
              </h5>
          </div>

          <div id="C${indice}_collapse" class="collapse" aria-labelledby="${indice}_head" data-parent="#accordion">
              <div class="card-body">
                <strong>${resto.address}</strong>

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
        setZoom(pos);
        displayReview(resto.placeId);

      });

      // Listener pour ajouer un Review
      $(`#${indice}_Review`).click((e) => {
        $('#Review_name').html(resto.restaurantName);
        $('#Review_address').html(resto.address);
        $('#modalReview').modal('toggle');
      });

    }
    indice++; // on incrémente l'indice (correspond à l'id)
  });
}

/**
 * @description Affiche les avis d'un restaurants lorsque l'utilisateur le séléctionne
 * @param {String} placeId 
 * @param {Integer} indice 
 */
function displayReview(placeId) {

  const resto = RESTOS.find((e) => e.placeId == placeId);
  const indice = RESTOS.indexOf(resto);

  $(`#${indice}_listReview`).html('<li class="text-danger">Chargement des avis ...</li>');
  getReview(placeId, () => {
    let totalStars = 0;
    let starsAverage = 0;
    let ulComment = ''; // Liste des commentaire afficher sur l'IHM
    RESTOS[indice].ratings.forEach(review => {
      totalStars++;
      starsAverage+=review.stars;
      ulComment += `<li>${review.stars.toFixed(1)} - <small> ${review.comment}</small></li>`;
    });
    starsAverage = starsAverage/totalStars;
    // resto.starsAverage = starsAverage;

    $(`#${indice}_listReview`).html(ulComment);
    // $(`#${indice}_starsAverage`).html(starsAverage);

  });
}

// --- FILTRE ---
function filters() {
  let min = $('#filterStarsMin').val();
  let max = $('#filterStarsMax').val();
  displayResto(min, max);
}

// Lorsque l'utilisateur veut effecter une recherche en fonction des étoiles des RESTOS.
$('#filterSend').click((e) => {
  filters();
});

$('#radius').change((e) => {
  ENV.nearbySearch = parseInt($('#radius').val());
  displayCircle(ENV.currentPos, ENV.nearbySearch);
  // getNearbyPlace(ENV.currentPos, () => {
  //   filters();
  // });
});

// Lorsque l'utilisateur change le rayon de recherche
$('#sendChangeRadius').click((e) => {
  e.preventDefault();
  ENV.nearbySearch = parseInt($('#radius').val());
  clearCircle();
  getNearbyPlace(ENV.currentPos, () => {
    filters();
  });
}); 

$('#sendSearch').click((e) => {
  e.preventDefault();
  let address = $('#search').val();

  if(!address) alert('Vous devez rentrer une adresse valide !');
  else {
    findPosition(address);
  }

});

// --- Add Review ---
$('#Review_send').click((e) => {
  e.preventDefault();
  const name = $('#Review_name').html();
  let comment = $('#Review_comment').val();
  const stars = parseInt($('#Review_stars').val());

  if (!comment) alert('Vous devez rentrer un commentaire !');
  else {
    const datas = {
      stars,
      comment
    };

    const resto = RESTOS.find((e) => e.restaurantName == name);
    resto.ratings.push(datas);

    // On clear le comment et on fait disparraitre la modal
    $('#Review_comment').val('');
    $('#modalReview').modal('toggle');

    filters(); // On actualise les resto en fonction des filtre choisi par l'utilisateur

    // On affiche le restaurant
    const indice = RESTOS.indexOf(resto);
    $(`#C${indice}_collapse`).collapse('toggle');
    displayReview(RESTOS[indice].placeId);

  }

});

// --- ADD RESTO ---
$('#add_send').click((e) => {
  e.preventDefault();
  let name = $('#add_name').val();
  let comment = $('#add_comment').val();
  const stars = parseInt($('#add_stars').val());
  const address = $('#add_address').val();
  let pos = $('#add_pos').val();
  pos = JSON.parse(pos);

  if (!name) alert('Vous devez rentrer un nom pour le restaurant !');
  else if (!comment) alert('Vous devez rentrer un commentaire !');
  else {
    const resto = {
      restaurantName: name,
      address,
      lat: pos.lat,
      long: pos.lng,
      ratings: [
        {
          stars,
          comment
        },
      ],
      starsAverage: stars,
      getReview: true
    };
    // On ajoute le nouveau resto dans la liste, un marker se placera lors de l'actualisation de la carte
    RESTOS.push(resto);

    // On clear les champs et on fait disparraitre la modal
    $('#add_name').val('');
    $('#add_comment').val('');
    $('#modalAdd').modal('toggle');

    // On affiche le restaurant et on zoom sur la carte
    const indice = RESTOS.indexOf(resto);
    RESTOS[indice].placeId = indice;
    
    setZoom(pos);
    filters(); // On actualise les RESTOS en fonction des filtre choisi par l'utilisateur
    $(`#C${indice}_collapse`).collapse('toggle');
    displayReview(RESTOS[indice].placeId);

  }

});

