/* Eric Anderson */
/* TGIS 504 */
/* Lab 3c */
/* javascript.js */

// Welcome message, allows user to choose automatic or manual location entry.
alert("Welcome! Please share your location to get your coordinates. If you do not want to share, enter coordinates manually.")
navigator.geolocation.getCurrentPosition(getPos,getPos);
// ALl code is wrapped in this function to ensure location is obtained once, and for the map to use it.
function getPos(pos) {
  // Code to handle window alerts and prompts before loading map at user-specified coordinates.
  if (pos.message != "User denied Geolocation") {
    var get_coords1 = pos.coords.latitude;
    var get_coords2 = pos.coords.longitude;
  }
  else {
    var get_coords1 = "";
    var get_coords2 = "";
  }
  while (get_coords1 != null) {
    if (get_coords1.length != 0) { break; }
    else { get_coords1 = window.prompt("Please enter your latitude (-90 to 90):") } // Manual latitude entry.
  }
  while (get_coords2 != null) {
    if (get_coords2.length != 0) { break; }
    else { get_coords2 = window.prompt("Please enter your longitude (-180 to 180):") } // Manual longitude entry.
  }

  // Convert user input to floating points just in case.
  get_coords1 = parseFloat(get_coords1)
  get_coords2 = parseFloat(get_coords2)

  // Decide which statement to display based on correct/incorrect user input.
  if (Math.abs(get_coords1) > 90 || Math.abs(get_coords2) > 180) {
    document.getElementById("txt").innerHTML = "<br> You may have entered your coordinates wrong. Refresh the page and try again. <br> <br> <button onClick = window.location.reload();> Refresh Page </button> <br> <br> ";
  }
  else if (isNaN(get_coords1) || isNaN(get_coords2)) {
    document.getElementById("txt").innerHTML = "<br> You may have entered your coordinates wrong. Refresh the page and try again. <br> <br> <button onClick = window.location.reload();> Refresh Page </button> <br> <br> ";
  }
  else {
    setTimeout(function() { alert("This map interfaces users with a dynamic CARTO data collecting tool to record live temperature readings in their city of choice. Only markers can be placed on the map; once placed, the user is prompted for other metadata. \n\nIf this is not your city of choice, please refresh the page and try again."); }, 4000);
  }

  // Load Leaflet map with personalized Mapbox map style.
  var map = L.map('map').setView([get_coords1, get_coords2], 11);
  L.tileLayer('https://api.mapbox.com/styles/v1/ermian98/ckhws5qm105i819phtroyx21o/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZXJtaWFuOTgiLCJhIjoiY2tnaXVwYWtrMGEwbjJ1cGRlZDQ2bmd1OCJ9.gy2NOY8e3cmhzG6JiEyj4A', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: 'pk.eyJ1IjoiZXJtaWFuOTgiLCJhIjoiY2tod3I5NGozMXloczJ1bWpoMWtmeDR1YyJ9.em9VpowzKU06_3X8u-Gz2g'
  }).addTo(map);

  // Add draw group with appropriate functionality.
  var drawnItems = L.featureGroup().addTo(map);
  var cartoData = L.layerGroup().addTo(map);
  var url = "https://ermian98-uw.carto.com/api/v2/sql";
  var urlGeoJSON = url + "?format=GeoJSON&q=";
  var sqlQuery = "SELECT * FROM lab_3c_ermian98_uw";

  // Display date nicely
  function dateClean (date) {
    function mod(n, m) {
      return ((n % m) + m) % m;
    }
    strdate = date.toString();
    strmonth = strdate.substring(5,7) + "/";
    strday = strdate.substring(8,10) + "/";
    stryear = strdate.substring(0,4);
    strhour = mod(parseInt((strdate.substring(11,13))), 24);
    strminute = strdate.substring(14,16);
    morn_aft = 'am';
    if (strhour > 11) {
      strhour = strhour - 12;
      morn_aft = 'pm'
    }
    if (strhour == 0) {  strhour = 12; }
    return strmonth + strday + stryear + " @ " + strhour + ":" + strminute + morn_aft;
  }

  function addPopup(feature, layer) {
      layer.bindPopup(
           "<h4>" + dateClean(feature.properties.time) + "</h4>" +
           "<h1>" + feature.properties.temp + "&#176;" + feature.properties.units + "</h1>" +
           "<i>" + feature.properties.therm_type + " thermometer reading. </i>" +
           "<br> <i> Temperature submitted by: <b>" + feature.properties.username + "</b></i>"
      );
      // Rudimentary attempt at colorizing each marker by temperature value
      // A person would have to import a color gradient to another file to make this really work.
      max_temp = 8388608;
      my_temp = feature.properties.temp;
      if (feature.properties.units == "C") { // convert to Fahrenheit for visualization purposes
        my_temp = my_temp*1.8 + 32;
      }
      my_temp = Math.round(max_temp*(my_temp*0.01));
      hex_my_temp = "#" + my_temp.toString(16);
      L.circleMarker([layer.getLatLng().lat, layer.getLatLng().lng], {radius: 14, color: hex_my_temp})
      .setStyle({fillColor: hex_my_temp, fillOpacity: 0.6}).addTo(map)
  }

  fetch(urlGeoJSON + sqlQuery)
      .then(function(response) {
      return response.json();
      })
      .then(function(data) {
          L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
      });

  new L.Control.Draw({
      draw : {
          polyline : false,      // Lines disabled
          polygon : false,       // Polygons disabled
          rectangle : false,     // Rectangles disabled
          circle : false,        // Circles disabled
          circlemarker : false,  // Circle markers disabled
      },
      edit : {
          featureGroup: drawnItems
      }
  }).addTo(map);

  // Listening for drawing actions.
  document.addEventListener("click", setData);
  map.addEventListener("draw:created", function(e) {
      e.layer.addTo(drawnItems);
      createFormPopup();
  });
  map.addEventListener("draw:editstart", function(e) {
      drawnItems.closePopup();
  });
  map.addEventListener("draw:deletestart", function(e) {
      drawnItems.closePopup();
  });
  map.addEventListener("draw:editstop", function(e) {
      drawnItems.openPopup();
  });
  map.addEventListener("draw:deletestop", function(e) {
      if(drawnItems.getLayers().length > 0) {
          drawnItems.openPopup();
      }
  });

  // Functions
  function createFormPopup() {
      var popupContent =
          '<form>' +
          'What is your username?:<br><input type="text" id="input_user"><br>' +
          '<br>' + ' Date and time recorded:<br><input type="datetime-local" id="input_time"><br>' +
          '<br>' + ' Temperature (no units):<br><input type="number" id="temper"><br>' +
          '<br>' + ' Units (F or C):<br><input type="text" id="unis"><br>' +
          '<br>' + ' Type of thermometer (e.g. digital, mercury):<br><input type="text" id="thermo_type"><br>' +
          '<br>' + '<input type="checkbox" id="visit" name="visit" checked="checked">' +
          '<label for="visit"> I am reporting at this location</label><br>' +
          '<br>' + '<input type="button" value="Submit" id="submit">' +
          '</form>'
      drawnItems.bindPopup(popupContent).openPopup();
  }

  function setData(e) {
      if (e.target && e.target.id == "submit") {
          // Get user variable input
          var enteredTitle = document.getElementById("input_user").value;
          var enteredTime = document.getElementById("input_time").value;
          var enteredTemp = document.getElementById("temper").value;
          var enteredUnits = document.getElementById("unis").value;
          var enteredTherm_type = document.getElementById("thermo_type").value;
          var enteredBeenHere = document.getElementById("visit").value;

          // For each drawn layer
          drawnItems.eachLayer(function(layer) {
      			// Create SQL expression to insert layer
                  var checkedValue = 'false';
                  var ie = document.getElementById('visit');
                  if (ie.checked) {
                    checkedValue = 'true';
                  }
                  var drawing = JSON.stringify(layer.toGeoJSON().geometry);
                  var sql =
                      "INSERT INTO lab_3c_ermian98_uw (the_geom, username, time, temp, units, therm_type, on_site) " +
                      "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                      drawing + "'), 4326), '" +
                      enteredTitle + "', '" +
                      enteredTime + "', '" +
                      enteredTemp + "', '" +
                      enteredUnits + "', '" +
                      enteredTherm_type + "', '" +
                      checkedValue + "')";
                  console.log(sql);

                  // Send the data
                  fetch("https://ermian98-uw.carto.com/api/v2/sql", {
                      method: "POST",
                      headers: {
                          "Content-Type": "application/x-www-form-urlencoded"
                      },
                      body: "q=" + encodeURI(sql)
                  })
                  .then(function(response) {
                      return response.json();
                  })
                  .then(function(data) {
                      console.log("Data saved:", data);
                  })
                  .catch(function(error) {
                      console.log("Problem saving the data:", error);
                  });

              // Transfer submitted drawing to the CARTO layer
              //so it persists on the map without you having to refresh the page
              var newData = layer.toGeoJSON();
              newData.properties.title = enteredTitle;
              newData.properties.time = enteredTime;
              newData.properties.temp = enteredTemp;
              newData.properties.units = enteredUnits;
              newData.properties.therm_type = enteredTherm_type;
              newData.properties.on_site = enteredBeenHere;
              L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);
          });
          // Clear drawn items layer
          drawnItems.closePopup();
          drawnItems.clearLayers();
      }
  }
}
// END
