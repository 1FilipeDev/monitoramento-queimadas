// Inicializar o mapa
var map = L.map('map').setView([-15.7801, -47.9292], 5); // Coordenadas de Brasília, Brasil

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var userCoordinates = null;
var marker;
var heatData = [
    [-15.7801, -47.9292, 0.5],
    [-3.1190, -60.0217, 0.8],
    [-22.9068, -43.1729, 0.3]
];

var heat = L.heatLayer(heatData, { radius: 25 }).addTo(map);

document.getElementById('reportForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var location = document.getElementById('location').value;
    var level = document.getElementById('level').value;
    var category = document.getElementById('category').value;
    var additionalInfo = document.getElementById('additionalInfo').value;
    var photoInput = document.getElementById('photo');
    var photoFile = photoInput.files.length > 0 ? photoInput.files[0] : null;

    if (userCoordinates) {
        addMarker(userCoordinates, level, category, additionalInfo, photoFile);
    } else {
        geocodeLocation(location, function(coordinates) {
            addMarker(coordinates, level, category, additionalInfo, photoFile);
        });
    }
    document.getElementById('reportForm').reset();
});

function addMarker(coordinates, level, category, additionalInfo, photo) {
    let markerColor = level === '1' ? 'yellow' : level === '2' ? 'orange' : 'red';
    let popupContent = `
        <b>Nível:</b> ${level}<br>
        <b>Local:</b> ${category}<br>
        <b>Info:</b> ${additionalInfo || 'Nenhuma'}<br>
    `;

    if (photo) {
        const imageUrl = URL.createObjectURL(photo);
        popupContent += `<b>Foto:</b><br><img src="${imageUrl}" alt="Foto Anexada" style="max-width: 100px; max-height: 100px;"><br>`;
    }

    marker = L.circleMarker([coordinates.lat, coordinates.lng], {
        color: markerColor,
        radius: 10
    }).bindPopup(popupContent).addTo(map);

    map.setView([coordinates.lat, coordinates.lng], 12);
    heat.addLatLng([coordinates.lat, coordinates.lng, level / 3]);
}

function geocodeLocation(location, callback) {
    if (/^\d{5}-?\d{3}$/.test(location)) {
        fetch(`https://viacep.com.br/ws/${location.replace('-', '')}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    alert('CEP inválido');
                } else {
                    geocodeLocationByAddress(`${data.logradouro}, ${data.localidade}, ${data.uf}`, callback);
                }
            });
    } else {
        geocodeLocationByAddress(location, callback);
    }
}

function geocodeLocationByAddress(address, callback) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': address}, function(results, status) {
        if (status === 'OK') {
            var latLng = results[0].geometry.location;
            callback({lat: latLng.lat(), lng: latLng.lng()});
        } else {
            alert('Geocode falhou: ' + status);
        }
    });
}

document.getElementById('useLocation').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            userCoordinates = {lat: lat, lng: lon};
            document.getElementById('location').value = `Lat: ${lat}, Lon: ${lon}`;
            map.setView([lat, lon], 12);
        });
    } else {
        alert('Geolocalização não é suportada pelo navegador.');
    }
});
