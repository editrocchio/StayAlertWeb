
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();

  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true
  });

  var docRef = db.collection("new_data").doc("neighbourhoods");

  var map;
  var locations = [];
  var heatMapCoords = [];
  var markers;
  var markerCluster;
  var crimeObject;
  var dt;
  var infoWin;
  var fromDatabase = [];
  var checkedUnchecked = {"Break and Enter Commercial":true, "Break and Enter Residential/Other":true,
    "Mischief":true, "Other Theft":true, "Theft from Vehicle":true, "Theft of Vehicle":true,
    "Theft of Bicycle":true,"Vehicle Collision or Pedestrian Struck (with Injury)":true};

  function setMarkers(crime, address, month, day, year, time, latitude, longitude) {
    locations.push({
      lat: latitude,
      lng: longitude,
      info: "<h3>Crime:</h3> " + crime + "<h3>Address:</h3> " + address +
        "<h3>Date:</h3>" + month + " " + day + " " + year + "<h3>Time:</h3>" +
        time
    });
  }

  /*When the map gets initialized get the data from Firestore and put the
  individual data in a global variable. Also set up the initial cluster
  markers and heat map.*/
  function initMap() {
    //Set fromDatabase to any sessionStorage.
    zoomFromDatabase();

    docRef.get().then(function(doc) {
      var data;

      if (doc.exists) {
        data = doc.data();
        dt = data[Object.keys(data)[1]];

        /*if fromDatabase is null then it didn't come from db page so zoom normally.
        Otherwise loop through the crimeObjects and find the matching one,
        then zoom to this spot.*/
        if(fromDatabase == null) {
          map = new google.maps.Map(document.getElementById('map'), {
              center: {
                lat: 49.2807323,
                lng: -123.117211
              },
              zoom: 14
            });
         } else {
           for(n=0; n<dt.length; n++) {
             crimeObject = dt[n];
             if(fromDatabase["crime"] == crimeObject["crime"]
              && fromDatabase["address"] == crimeObject["hundredBlockAddress"]
              && fromDatabase["date"] == crimeObject["monthOfCrime"] + " " +
              crimeObject["dayOfCrime"] + " " + crimeObject["yearOfCrime"]
              && fromDatabase["time"] == crimeObject["timeOfCrimeTwentyFourHour"]) {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: {
                      lat: crimeObject["latitude"],
                      lng: crimeObject["longitude"]
                    },
                    zoom: 20
                  });
              }
           }
         }

        setMCluster();

        for (n=0; n<dt.length; n++) {
          crimeObject = dt[n];
          heatMapCoords.push(new google.maps.LatLng(crimeObject["latitude"], crimeObject["longitude"]));
        }
      }

      $(document).ready(function() {
        $('.menu .item')
          .tab();

        /*If checked set crime as true and reload marker clusters*/
        $('.ui.checkbox').checkbox({
          onChecked: function() {
            var c = $(this).attr('id');
            checkedUnchecked[c] = true;
            markerCluster.clearMarkers();
            setMCluster();
          },

          /*If unchecked set crime as false and reload marker clusters*/
          onUnchecked: function() {
            var c = $(this).attr('id');
            checkedUnchecked[c] = false;
            markerCluster.clearMarkers();
            setMCluster();
          }
        });

        /* Check or uncheck all checkbox. Set the checkedUnchecked values to
        either true or false, and reload the map.*/
        $('.ui.checkbox.check-all').checkbox({
          onChecked: function() {
            $('.ui.checkbox').checkbox('check');

            for(f in checkedUnchecked) {
              if(checkedUnchecked[f] == false) {
                checkedUnchecked[f] = true;
              }
            }
            markerCluster.clearMarkers();
            setMCluster();
          },
          onUnchecked: function() {
            $('.ui.checkbox').checkbox('uncheck');

            for(f in checkedUnchecked) {
              if(checkedUnchecked[f] == true) {
                checkedUnchecked[f] = false;
              }
            }
            markerCluster.clearMarkers();
            setMCluster();

          }
        });

      });

    }).catch(function(error) {
      console.log("Error getting document:", error);
    });

    infoWin = new google.maps.InfoWindow();

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: getPoints(),
      map: map
    });
  }

  //Turn on/off heatmap.
  function toggleHeatmap() {
    markerCluster.clearMarkers();
    locations = [];
    if (heatmap.getMap()) {
      heatmap.setMap(null);
      setMCluster();
    } else {
      heatmap.setMap(map);
    }
  }

  /*Loop through the neighbourhood and grab the individual crime object.
    If the crime is active then add it to locations array. Add this to
    clusterMarkers which gets pushed to map. */
  function setMCluster() {
    locations = [];
    for (n = 0; n < dt.length; n++) {
      crimeObject = dt[n];
      if(checkedUnchecked[crimeObject["crime"]] == true) {
        setMarkers(crimeObject["crime"], crimeObject["hundredBlockAddress"],
          crimeObject["monthOfCrime"], crimeObject["dayOfCrime"],
          crimeObject["yearOfCrime"], crimeObject["timeOfCrimeTwentyFourHour"],
          crimeObject["latitude"], crimeObject["longitude"]);
      }

    }

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    markers = locations.map(function(location, i) {
      var marker = new google.maps.Marker({
        position: location
      });
      google.maps.event.addListener(marker, 'click', function(evt) {
        infoWin.setContent(location.info);
        infoWin.open(map, marker);
      })
      return marker;
    });

    // Add a marker clusterer to manage the markers.
    markerCluster = new MarkerClusterer(map, markers, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      maxZoom: 18
    });
  }

  function getPoints() {
    return heatMapCoords;
  }

  function zoomFromDatabase() {
    fromDatabase = JSON.parse(sessionStorage.getItem('fromDatabase'));
    console.log(fromDatabase);
    sessionStorage.clear();
  }
