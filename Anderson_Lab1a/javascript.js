/* Eric Anderson */
/* TGIS 504 */
/* Lab 1a */
/* javascript.js */

/* Alert window */
alert("Note: this page asks for your location information. This is in order to provide you the best user experience. We pledge not to store or share your personal information.");

/* Mapbox basemaps variables */
var light = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWpzbGFnZXIiLCJhIjoiZUMtVjV1ZyJ9.2uJjlUi0OttNighmI-8ZlQ', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id:'mapbox/light-v10',
    tileSize: 512,
    zoomOffset: -1,
});
var dark = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWpzbGFnZXIiLCJhIjoiZUMtVjV1ZyJ9.2uJjlUi0OttNighmI-8ZlQ', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id:'mapbox/dark-v10',
    tileSize: 512,
    zoomOffset: -1,
});

/* Initialize the map on click */
function revealMap() {
  var map = L.map('map', {layers:[light]}).fitWorld();
  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
  map.locate({setView: true, maxZoom: 16});

  /* Add layer controls */
  var baseMaps = {
      "Light": light,
      "Dark": dark
    };
  L.control.layers(baseMaps).addTo(map);

/* Functions that assess accuracy of geolocation */
  function onLocationFound(e) {
    var radius = e.accuracy;
    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + Math.round(radius * 3.28084) + " feet of this point").openPopup();
    if (radius <= 100) {
        L.circle(e.latlng, radius, {color: 'green'}).addTo(map);
    }
    else {
        L.circle(e.latlng, radius, {color: 'red'}).addTo(map);
    }
    /* Sun Calculation variables */
    var times = SunCalc.getTimes(new Date(), e.latitude, e.longitude);
    var sunrise = times.sunrise.getHours();
    var sunset = times.sunset.getHours();
    var currentTime = new Date().getHours();
        if (sunrise < currentTime && currentTime < sunset){
          map.removeLayer(dark);
          map.addLayer(light);
        }
        else {
          map.removeLayer(light);
          map.addLayer(dark);
        }
  }
  function onLocationError(e) {
    alert(e.message);
  }
}
