/* Eric Anderson */
/* TGIS 504 */
/* Lab 3b */
/* javascript.js */

// Code to handle window alerts and prompts before loading map at user-specified coordinates.
alert("Welcome! Click okay to enter the coordinates of your hometown.")
var get_coords1 = ""
var get_coords2 = ""
while (get_coords1 != null) {
  if (get_coords1.length != 0) { break; }
  else { var get_coords1 = window.prompt("Please enter your latitude (-90 to 90):", "36.5298") } // Default latitude of my hometown.
}
while (get_coords2 != null) {
  if (get_coords2.length != 0) { break; }
  else { var get_coords2 = window.prompt("Please enter your longitude (-180 to 180):", "-87.3595") } // Default longitude of my hometown.
}
// Convert user input to floating points.
get_coords1 = parseFloat(get_coords1)
get_coords2 = parseFloat(get_coords2)

// Decide which statement to display based on correct/incorrect user input.
if (Math.abs(get_coords1) > 90 || Math.abs(get_coords2) > 180) {
  document.getElementById("txt").innerHTML = "<br> You may have entered your coordinates wrong. Refresh the page and try again. <br> <br> <button onClick = window.location.reload();> Refresh Page </button> <br> <br> ";
}
else if (isNaN(get_coords1) || isNaN(get_coords2)) {
  document.getElementById("txt").innerHTML = "<br> You may have entered your coordinates wrong. Refresh the page and try again. <br> <br> <button onClick = window.location.reload();> Refresh Page </button> <br> <br> ";
}
else if (get_coords1 == 36.5298 && get_coords2 == -87.3595) {
  setTimeout(function() { alert("This map serves as the spatial component of a dynamic data collecting tool for users to record their favorite hometown landmarks. Markers can be placed and polygons can be drawn; once added to the map, the user is prompted for metadata. \n\nYou entered the default coordinates, which correspond to one of my hometowns! Refresh this page if you want to load your own hometown."); }, 2000);
}
else {
  setTimeout(function() { alert("This map serves as the spatial component of a dynamic data collecting tool for users to record their favorite hometown landmarks. Markers can be placed and polygons can be drawn; once added to the map, the user is prompted for metadata. \n\nIf this is not your hometown, please refresh the page and try again."); }, 4000);
}

// Load Leaflet map with personalized Mapbox map style.
var map = L.map('map').setView([get_coords1, get_coords2], 12);
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
var sqlQuery = "SELECT the_geom, description, name, visited_in_person FROM lab_3b_ermian98_uw";

function addPopup(feature, layer) {
    var visit_string = "";
    if (feature.properties.visited_in_person) { visit_string = "TRUE" }
    else { visit_string = "FALSE" }
    layer.bindPopup(
        "<h3>" + feature.properties.name + "</h3>" +
        feature.properties.description + "<br><br><i> I have visited here before: <b>" +
        visit_string + "</b></i>"
    );
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
        'Title of location:<br><input type="text" id="input_title"><br>' +
        '<br>' + ' Description:<br><input type="text" id="input_desc"><br>' +
        '<br>' + '<input type="checkbox" id="visit" name="visit">' +
        '<label for="visit"> I have been here before</label><br>' +
        '<br>' + '<input type="button" value="Submit" id="submit">' +
        '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

function setData(e) {
    if (e.target && e.target.id == "submit") {
        // Get title and description
        var enteredTitle = document.getElementById("input_title").value;
        var enteredDescription = document.getElementById("input_desc").value;
        var enteredBeenHere = document.getElementById("visit").value;
        // Print title and description

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
                    "INSERT INTO lab_3b_ermian98_uw (the_geom, name, description, visited_in_person) " +
                    "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                    drawing + "'), 4326), '" +
                    enteredTitle + "', '" +
                    enteredDescription + "', '" +
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
            newData.properties.description = enteredDescription;
            newData.properties.name = enteredTitle;
            newData.properties.visitation = enteredBeenHere;
            L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);
        });
        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();
    }
}
// END
