  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();
  var content = [];
  var dt;
  var rowClicked;

  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true
  });

  var docRef = db.collection("new_data").doc("neighbourhoods");

  /*Get the data from Firestore and put it in neighbourhood's variable.
  Loop through this to get searchable details.*/
    docRef.get().then(function(doc) {
        if (doc.exists) {
          var data = doc.data();
          dt = data[Object.keys(data)[1]];

          for (n = 0; n < dt.length; n++) {
            var crimeObject = dt[n];

            searchableItems(crimeObject["crime"], crimeObject["hundredBlockAddress"],
            crimeObject["monthOfCrime"], crimeObject["dayOfCrime"],
            crimeObject["yearOfCrime"], crimeObject["timeOfCrimeTwentyFourHour"]);
          }

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }

        //Fixes time format by checking if size is less than 4, and adds a 
        //0 if so.
        function fixTime(time) {
            parts = time.split(":");
            console.log(parts);
            minutes = parts[1];
              if(minutes.length==1) {
                  return time + "0";
              }
              return time;
        }

        /*Sets up the search bar, sets content as the searchable array and
        allows the title and description to be searchable*/
        $(document).ready(function() {
          $('.ui.search')
            .search({
              source: content,
              searchFields: [
                'title', 'description'
              ],
              //User clicks a search result, it is returned in result variable.
              onSelect: function(result){
                sortOnClick(result["title"], parseAddressFromResult(result["description"]));
              }
          });

          //Loop through the results and set up the table here.
          for (n = 0; n < dt.length; n++) {
            var crimeObject = dt[n];
            populateTable(crimeObject["crime"], crimeObject["hundredBlockAddress"],
            crimeObject["monthOfCrime"], crimeObject["dayOfCrime"],
            crimeObject["yearOfCrime"], fixTime(crimeObject["timeOfCrimeTwentyFourHour"]));
          }

          //Add neighbourhood caption.
          $("#table").append("<caption>Central Business District</caption>");

          //Make table sortable.
          $('table').tablesort();

          addEventListeners();

          //Make each row link to index.html
          $("#tbody").on('click', 'tr', function() {
              window.location = 'index.html';
          });
        });


    }).catch(function(error) {
        console.log("Error getting document:", error);
    });



    //Pushes the details to content array
    function searchableItems(crime, address, month, day, year, time) {
      content.push({
        title: crime,
        description: "<div>Address: " + address + "</div>"
        + "<div>Date: " + month + " " + day + " " + year + "</div>"
        + "<div>Time: " + time + "</div>"
      });
    };

    //Find the table and append a new row with the required info.
    function populateTable(crime, address, month, day, year, time) {
        $(table).find('tbody').append(
          "<tr class='clickable'><td>" + crime + "</td><td>" + address + "</td><td>" + month +
            " " + day + " " + year + "</td><td>" + time + "</td></tr>"
        );

        //Hide the loading div after it begins to poplate.
        $("#load").css("display", "none");
    }

    /*First reset all the display rows in case they were previously hidden.
    Then hide all the rows that don't contain the crime and address.*/
    function sortOnClick(crime, address) {
      var table=document.getElementById('table');

      for(var i=0; i<table.rows.length;i++){
        $(table.rows[i]).css("display", "table-row");
       }

       for(var i=1; i<table.rows.length;i++){
         var c=(table.rows[i].cells[0].innerHTML);
         var a=(table.rows[i].cells[1].innerHTML);
         if(!(c == crime) && !(" " + a == address)) {
          $(table.rows[i]).css("display", "none");
          }
        }
    }

    /*Get the address from the click result. First get the position of the
    second '<' which will always be the end of the address. Return the
    substring starting at 13, which will always be the start of the
    address and ending at the position found in the loop.*/
    function parseAddressFromResult(result) {
      var addressStopPoint = 1;

      while(result.charAt(addressStopPoint) != '<') {
        addressStopPoint++;
      }
      return result.substring(13, addressStopPoint);
    }

    /*Loop through the rows and add an event listener. The function pushes
    the row details to the rowClicked array.*/
    function addEventListeners() {
      var rows = document.getElementsByClassName("clickable");

      for (var i = 0; i < rows.length; i++) {
          rows[i].addEventListener("click", function(){
              rowClicked={
                crime:$(this).closest("tr").find("td:first-child").text(),
                address:$(this).closest("tr").find("td:nth-child(2)").text(),
                date:$(this).closest("tr").find("td:nth-child(3)").text(),
                time:$(this).closest("tr").find("td:nth-child(4)").text()
              };
            sessionStorage.setItem('fromDatabase', JSON.stringify(rowClicked));
          });
      }
    }
