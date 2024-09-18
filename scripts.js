// Inicializar o mapa
var map = L.map('map').setView([-15.7801, -47.9292], 5); // Coordenadas de Brasília, Brasil

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var userCoordinates = null; // Variável para armazenar a localização do usuário
var marker; // Armazenar o marcador para poder reposicionar

// Exemplo de dados de queimadas (latitude, longitude, intensidade)
var heatData = [
    [-15.7801, -47.9292, 0.5], // Brasília
    [-3.1190, -60.0217, 0.8],  // Manaus
    [-22.9068, -43.1729, 0.3]  // Rio de Janeiro
];

// Adicionar a camada de calor ao mapa
var heat = L.heatLayer(heatData, {radius: 25}).addTo(map);

// Função para centralizar o mapa na localização do usuário ao carregar a página
function setUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            userCoordinates = {lat: lat, lng: lon}; // Armazenar as coordenadas do usuário
            map.setView([lat, lon], 12); // Centralizar o mapa na localização do usuário
            L.marker([lat, lon]).addTo(map).bindPopup('Você está aqui!').openPopup();
        }, function(error) {
            console.error("Erro ao obter localização: ", error);
        });
    } else {
        alert('Geolocalização não é suportada pelo navegador.');
    }
}

// Chamar a função ao carregar a página
window.onload = setUserLocation;

// Capturar dados do formulário e adicionar marcador colorido
document.getElementById('reportForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir o envio padrão do formulário

    var location = document.getElementById('location').value;
    var level = document.getElementById('level').value;
    var additionalInfo = document.getElementById('additionalInfo').value.split(' ').slice(0, 50).join(' '); // Limitar a 50 palavras

    // Se o usuário usou a localização atual ou CEP, utilizar as coordenadas armazenadas
    if (userCoordinates) {
        addMarker(userCoordinates, level, additionalInfo);
    } else {
        // Fazer a geocodificação do endereço ou CEP inserido
        geocodeLocation(location, function(coordinates) {
            addMarker(coordinates, level, additionalInfo);
        });
    }

    document.getElementById('reportForm').reset();
});

// Função para adicionar marcador colorido no mapa
function addMarker(coordinates, level, additionalInfo) {
    let markerColor;
    switch (level) {
        case '1':
            markerColor = 'yellow';
            break;
        case '2':
            markerColor = 'orange';
            break;
        case '3':
            markerColor = 'red';
            break;
    }

    if (marker) {
        map.removeLayer(marker); // Remove o marcador anterior se existir
    }

    marker = L.circleMarker([coordinates.lat, coordinates.lng], {
        color: markerColor,
        radius: 10
    }).bindPopup(`<b>Nível:</b> ${level}<br><b>Info:</b> ${additionalInfo}`).addTo(map);

    map.setView([coordinates.lat, coordinates.lng], 12);
    heat.addLatLng([coordinates.lat, coordinates.lng, level / 3]);

    // Permitir ao usuário ajustar manualmente o marcador no mapa
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        userCoordinates = {lat: e.latlng.lat, lng: e.latlng.lng}; // Atualizar as coordenadas
    });
}

// Função para converter localização (CEP ou endereço) usando a API ViaCEP ou Google Maps
function geocodeLocation(location, callback) {
    // Verificar se é um CEP (somente números, 8 dígitos)
    if (/^\d{5}-?\d{3}$/.test(location)) {
        fetch(`https://viacep.com.br/ws/${location.replace('-', '')}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    alert('CEP inválido');
                } else {
                    // Converte o endereço retornado em coordenadas (exemplo simplificado)
                    // Para uma solução mais precisa, use uma API como Google Maps ou OpenStreetMap
                    geocodeLocationByAddress(`${data.logradouro}, ${data.localidade}, ${data.uf}`, callback);
                }
            });
    } else {
        geocodeLocationByAddress(location, callback); // Para endereço não-CEP
    }
}

// Função auxiliar para converter endereço em coordenadas usando API de geocodificação (exemplo Google Maps)
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

// Usar localização atual do usuário (sem marcar no mapa ainda)
document.getElementById('useLocation').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            userCoordinates = {lat: lat, lng: lon}; // Armazenar as coordenadas do usuário
            document.getElementById('location').value = `Lat: ${lat}, Lon: ${lon}`; // Preencher a localização automaticamente
            map.setView([lat, lon], 12); // Centralizar o mapa na localização do usuário
        });
    } else {
        alert('Geolocalização não é suportada pelo navegador.');
    }
});
// Recuperar os dados do Firebase e exibir no mapa
firebase.database().ref('reports').on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
        var data = childSnapshot.val();

        // Adicionar os dados ao mapa (ajuste para usar a função de geocodificação ou coordenadas diretas)
        var coordinates = getCoordinatesFromLocation(data.location); // Função fictícia para obter as coordenadas
        addMarker(coordinates, data.level, data.category, data.additionalInfo, null);
    });
});
