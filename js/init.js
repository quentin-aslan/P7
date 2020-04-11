/**
 * @description Lors du chargement de l'API, on lui passe la fonction en parametre de callback donc lorsque l'api de google est chargé, on instantie la class MapG
 */
function initMap() {
  const map = new MapG();
}

$(() => {
  // Initialisation du plugin JQUERY qui permet d'afficher des smileys lors de l'attribution d'une note à un avis.

  $('#Review_stars').attr('rating', 4);
  $('#add_stars').attr('rating', 4);
  var emotionsArray = ['angry','disappointed','meh', 'happy', 'heart'];
  $("#Review_stars").emotionsRating({
    emotionSize: 30,
    bgEmotion: 'happy',
    emotions: emotionsArray,
    color: '#FF0066',
    initialRating: 4,
    onUpdate: function(rating) {
      $('#Review_stars').attr('rating', rating);
    }
  });

  $("#add_stars").emotionsRating({
    emotionSize: 30,
    bgEmotion: 'happy',
    emotions: emotionsArray,
    color: '#FF0066',
    initialRating: 4,
    onUpdate: function(rating) {
      $('#add_stars').attr('rating', rating);
    }
  });

});