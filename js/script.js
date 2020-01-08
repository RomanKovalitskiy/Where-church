
var map, geo, list, lastInfoWindow, startPos, myPosition;
var spinner = document.getElementById('spinner');

function initMap(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../list.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          list = JSON.parse(xobj.responseText);
          _initMap();
        }
    };
    xobj.send(null);
}

function _initMap(myPosition) {
    var zoom, positionMap;
    if(myPosition) {
        zoom = 12;
        positionMap =  {lat: myPosition.lat , lng: myPosition.lng};
    } else {
        var zoom = 6 ;
        var positionMap = {lat: 53.930239, lng: 28.541745};
    }

    map = new google.maps.Map(document.getElementById('map'), {
        center: positionMap,
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    function addMarker(item , color) {
        var url = "https://maps.google.com/mapfiles/ms/icons/";
        url += color + "-dot.png";
        var marker = new google.maps.Marker({
            map: map,
            draggable: false,
            position: {lat: item.lat , lng: item.lng},
            icon: {
                url: url
            }
        });
        if (color === 'green') return;
        var contentString = '<div id="content">'+
            `<h1 id="firstHeading" class="firstHeading">Церковь ${item.title || ""}</h1>`+
            `<div id="bodyContent">
            ${item.address ? `<p>Адрес: ${item.address}</p>`: ""}
            ${item.time ? `<p>Богослужения: ${item.time}</p>`: ""}
            ${item.shepherd ? `<p>Пастор церкви: ${item.shepherd}</p>`: ""}
            ${item.phone ? `<p>Телефон: ${item.phone}</p>`: ""}
            </div></div>`;

        var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 350,
        });

        marker.addListener('click', function() {
            lastInfoWindow ? lastInfoWindow.close() : "";
            infowindow.open(map, marker);
            lastInfoWindow = infowindow;
        });
        map.addListener('click', function() {
            infowindow.close();
        });
    };
    for ( var i = 0; i < list.hve.length; i++) {
        addMarker(list.hve[i] , 'red')
    };
    for ( var i = 0; i < list.ehb.length; i++) {
        addMarker(list.ehb[i], 'blue')
    };
    for ( var i = 0; i < list.hpe.length; i++) {
        addMarker(list.hpe[i], 'pink')
    };
    if(myPosition) {
        addMarker(myPosition, 'green');
    };
}

var geoOptions = {
    enableHighAccuracy: true
};

var geoSuccess = function(position) {
    myPosition = {
        "position": true,
        "lat": position.coords.latitude,
        "lng": position.coords.longitude,
    };
    _initMap(myPosition);
    searchChurch(myPosition);
    spinner.style.display= "none";
};

var geoError = function(position) {
    alert('Ошибка, не могу определить местоположение');
    console.log('Error occurred. Error code: ' + error.code);
};

function getCurrentPosition (){
    if (navigator.geolocation) {
        spinner.style.display= "block";
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
    } else alert('Геолокация пока не поддерживается для вашего устройства.');
}

function createList(list) {
  const parents = document.getElementById('list');
  parents.style.display = 'flex';
  for ( var i = 0; i < list.length; i++) {
    let div = document.createElement('div');
    div.className = "item-list";
    div.innerHTML = `<h3>${list[i].address} - ${list[i].distance.replace(".",",")} км.</h3>`+
      `${list[i].title ? `<p>Церковь ${list[i].title}</p>`: ""}
      ${list[i].time ? `<p>Богослужения: ${list[i].time}</p>`: ""}
      ${list[i].shepherd ? `<p>Пастор церкви: ${list[i].shepherd}</p>`: ""}
      ${list[i].phone ? `<p>Телефон: ${list[i].phone}</p>`: ""}`;
    parents.append(div);
  }
};

function searchChurch (myPosition){
  var p1 = new google.maps.LatLng(myPosition.lat, myPosition.lng);
  var nearChurch = [...list.hve, ...list.ehb]
    .map( item => {
      if(!item.lat){
        item.distance = Infinity;
        return item;
      };
      var p2 = new google.maps.LatLng(item.lat, item.lng);
      item.distance = (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(1);
      return item;
    })
    .sort( (a, b) => {
      return a.distance - b.distance
    });
  createList(nearChurch.slice(0, 9));
}
