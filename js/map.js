var map = L.map('mapid').setView([51.505, -0.09], 3);

// тайловый слой карты
L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: "© <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
}).addTo(map);

//url usgs
var earthUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=2014-01-02";

var markers = L.markerClusterGroup();
var markerRed = L.icon({
  iconUrl: "images/marker-red.png",
  iconSize:[45, 45]
});
var markerYellow = L.icon({
  iconUrl: "images/marker-yellow.png",
  iconSize:[45, 45]
});
var markerGreen = L.icon({
  iconUrl: "images/marker-green.png",
  iconSize:[45, 45]
});

// функция фильтрующая иконки в зависимости от значения магнитуды 
var filterIcons = function (feature, latlng) {
  if(feature.properties.mag < mediumMagnitudeValue) {
    return L.marker(latlng, {icon: markerGreen});
  } else if (feature.properties.mag >= mediumMagnitudeValue && feature.properties.mag < highMagnitudeValue){
    return L.marker(latlng, {icon: markerYellow});
  } else {
    return L.marker(latlng, {icon: markerRed});
  }
};

var mediumMagnitudeValue = 3;
var highMagnitudeValue = 6;

var jsonLayer = L.geoJson();
var myJson;

var firstCalendarDate;
var secondCalendarDate;

var today = new Date();
var yesterday;

var dd = String(today.getDate()).padStart(2, '0');
var yd = String(today.getDate() - 1).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); 
var yyyy = today.getFullYear();

today = yyyy + '-' + mm + '-' + dd;
yesterday = yyyy + '-' + mm + '-' + yd;

var magnitudeValue = 1;

var filterPopup = document.querySelector('.filter-button');
var filterWrapper = document.querySelector('.filter-wrapper');

var filterToggle = function () {
  filterWrapper.classList.toggle('hidden');
};

filterPopup.addEventListener('click', function (evt){
  evt.preventDefault();
  filterToggle();
});


//функция фильтрации магнитуды
var filterMagnitude = function (feature) {
  if(feature.properties.mag>=magnitudeValue){
    return feature;
  };
};

//функция создающая попап на отметках
var createPopup = function(feature, lyr){
  lyr.bindPopup("<b>Place: </b><i>"+feature.properties.place+"</i><br><b>Magnitude: </b><i>"+feature.properties.mag+"</i><br><b>USGS Information: </b><i><a href="+feature.properties.url+">USGS</a></i>");
};

//аякс запрос к серверу usgs
var earthquakeInfo = $.ajax({
    url:"http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime="+yesterday+"&endtime="+today+'',
    dataType: "json",
    success: console.log("earthquakeInfo data successfully loaded."),
    error: function (xhr) {
      alert(xhr.statusText)
    }
  });

  
  // код работает только после полного получения данных от запроса earthquakeInfo
  $.when(earthquakeInfo).done(function(earthquakeInfo){
      var myJson = earthquakeInfo;
      jsonLayer  = L.geoJson(myJson, {
        filter: filterMagnitude,
        onEachFeature: createPopup,
        pointToLayer: filterIcons
    });

    markers.addLayer(jsonLayer );
    markers.addTo(map);

    //функция создающая слайдер
    $( function() {
      $( "#slider-vertical" ).slider({
        orientation: "vertical",
        range: "min",
        min: 1,
        max: 12,
        value: 1,
        slide: function( event, ui ) {
          $( "#amount" ).val( ui.value );
          magnitudeValue = ui.value;

          markers.clearLayers();
					jsonLayer .clearLayers();

          jsonLayer  = L.geoJson(myJson, {
            filter: filterMagnitude,
            onEachFeature: createPopup,
            pointToLayer: filterIcons
          });

          markers.addLayer(jsonLayer );
					markers.addTo(map);
        }
      });
      $( "#amount" ).val( $( "#slider-vertical" ).slider( "value" ) );
    } );

    // функция создающая первый календарь
    $( function() {
      $( "#datepickerFirst" ).datepicker({
        onSelect: function(dateText, inst) { 
          var firstDateText = dateText.split('/');
          firstCalendarDate = firstDateText[2]+'-'+firstDateText[0]+'-'+firstDateText[1];
        }
      });
    });

    // функция создающая второй календарь
    $( function() {
      $( "#datepickerSecond" ).datepicker({
        onSelect: function(dateText, inst) { 

          markers.clearLayers();
					jsonLayer .clearLayers();

          var secondDateText = dateText.split('/');
          secondCalendarDate = secondDateText[2]+'-'+secondDateText[0]+'-'+secondDateText[1];
          
          var calendarInfoJson = $.ajax({
            url: "http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime="+firstCalendarDate+"&endtime="+secondCalendarDate+'',
            dataType: "json",
            success: console.log("calendar dates data successfully loaded."),
            error: function (xhr) {
              alert(xhr.statusText)
            }
          });

          // код работает только после полного получения данных от запроса calendarInfoJson
          $.when(calendarInfoJson).done(function(calendarInfoJson){
            var myJson = calendarInfoJson;
            jsonLayer  = L.geoJson(myJson, {
              filter: filterMagnitude,
              onEachFeature: createPopup,
              pointToLayer: filterIcons
            });
            markers.addLayer(jsonLayer );
            markers.addTo(map);

            $( "#slider-vertical" ).slider({
              slide: function( event, ui ) {
                $( "#amount" ).val( ui.value );
                magnitudeValue = ui.value;
      
                markers.clearLayers();
                jsonLayer.clearLayers();
      
                jsonLayer  = L.geoJson(myJson, {
                  filter: filterMagnitude,
                  onEachFeature: createPopup,
                  pointToLayer: filterIcons
                });
      
                markers.addLayer(jsonLayer);
                markers.addTo(map);
              }
            });
          });
        }
      });
    });
  });



