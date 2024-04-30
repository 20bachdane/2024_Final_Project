// Ensure that you have Leaflet's CSS and JS included in your HTML file
// Also include the PapaParse library if you're going to use it for parsing the CSV
var map;

document.addEventListener('DOMContentLoaded', createMap);

// Step 1: create map
function createMap() {
    // Create the map
    map = L.map('map', {
        center: [37.0902, -95.7129],  // Centered on the U.S.
        zoom: 4,
        minZoom: 2
    });

    // Define tile layers
    var worldLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    });

    // Add layer control to toggle between layers
    var baseLayers = {
        "World Imagery": worldLayer,
        "OpenStreetMap": osmLayer
    };

    L.control.layers(baseLayers).addTo(map);

    var controlDiv = document.createElement('div');
    controlDiv.id = 'controls';
    document.body.appendChild(controlDiv); // Append controls to the body or a specific container

    createYearInput(controlDiv);
    createMonthDropdown(controlDiv);
    createColorBlindModeCheckbox(controlDiv);

    loadCSVData();
}

function createYearInput(controlDiv) {
    var minYearLabel = document.createElement('label');
    minYearLabel.textContent = 'Select Minimum Year:';
    controlDiv.appendChild(minYearLabel);

    var minYearSelect = document.createElement('select');
    minYearSelect.id = 'minYearSelect';
    controlDiv.appendChild(minYearSelect);

    var maxYearLabel = document.createElement('label');
    maxYearLabel.textContent = 'Select Maximum Year:';
    controlDiv.appendChild(maxYearLabel);

    var maxYearSelect = document.createElement('select');
    maxYearSelect.id = 'maxYearSelect';
    controlDiv.appendChild(maxYearSelect);

    for (let i = 1950; i <= 2022; i++) {
        let minOption = document.createElement('option');
        minOption.value = i;
        minOption.textContent = i;
        minYearSelect.appendChild(minOption);

        let maxOption = document.createElement('option');
        maxOption.value = i;
        maxOption.textContent = i;
        maxYearSelect.appendChild(maxOption);
    }

    minYearSelect.value = 2020;  // Set a default value for the minimum year
    maxYearSelect.value = 2022;  // Set a default value for the maximum year

    minYearSelect.addEventListener('change', loadCSVData);
    maxYearSelect.addEventListener('change', loadCSVData);
}

function createMonthDropdown(controlDiv) {
    var minMonthLabel = document.createElement('label');
    minMonthLabel.textContent = 'Select Minimum Month:';
    controlDiv.appendChild(minMonthLabel);

    var minMonthSelect = document.createElement('select');
    minMonthSelect.id = 'minMonthSelect';
    controlDiv.appendChild(minMonthSelect);

    var maxMonthLabel = document.createElement('label');
    maxMonthLabel.textContent = 'Select Maximum Month:';
    controlDiv.appendChild(maxMonthLabel);

    var maxMonthSelect = document.createElement('select');
    maxMonthSelect.id = 'maxMonthSelect';
    controlDiv.appendChild(maxMonthSelect);

    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    months.forEach((month, index) => {
        let minOption = document.createElement('option');
        minOption.value = index + 1;  // Months are 1-indexed
        minOption.textContent = month;
        minMonthSelect.appendChild(minOption);

        let maxOption = document.createElement('option');
        maxOption.value = index + 1;
        maxOption.textContent = month;
        maxMonthSelect.appendChild(maxOption);
    });

    minMonthSelect.value = 1;  // Set a default value for the minimum month
    maxMonthSelect.value = 12;  // Set a default value for the maximum month

    minMonthSelect.addEventListener('change', loadCSVData);
    maxMonthSelect.addEventListener('change', loadCSVData);
}

function createColorBlindModeCheckbox(controlDiv) {
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'colorBlindModeCheckbox';
    checkbox.addEventListener('change', loadCSVData); // Re-load data when the mode is toggled

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' Color Blind Mode'));
    controlDiv.appendChild(label);
}

var allPolylines = []; // Store all polyline layers for easy management and clearing

function loadCSVData() {
    var minYear = parseInt(document.getElementById('minYearSelect').value);
    var maxYear = parseInt(document.getElementById('maxYearSelect').value);
    var minMonth = parseInt(document.getElementById('minMonthSelect').value);
    var maxMonth = parseInt(document.getElementById('maxMonthSelect').value);
    var isColorBlindMode = document.getElementById('colorBlindModeCheckbox') && document.getElementById('colorBlindModeCheckbox').checked;

    fetch('data/1950-2022_torn.csv')
        .then(response => response.text())
        .then(csvText => {
            var data = Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            }).data;

            clearMap();
            data.filter(row => row.yr >= minYear && row.yr <= maxYear && row.mo >= minMonth && row.mo <= maxMonth)
                .forEach(function(dataRow) {
                    var polyline = createPolyline(dataRow, isColorBlindMode);
                    if (polyline) {
                        polyline.addTo(map);
                        allPolylines.push(polyline);
                    }
                });
        })
        .catch(error => console.error("Error loading CSV data:", error));
}

function clearMap() {
    allPolylines.forEach(polyline => map.removeLayer(polyline));
    allPolylines = [];
}

function createPolyline(dataRow, isColorBlindMode) {
    if (dataRow.elat && dataRow.elon) {
        var latlngs = [
            [dataRow.slat, dataRow.slon],
            [dataRow.elat, dataRow.elon]
        ];

        var color = getColorBasedOnMagnitude(dataRow.mag, isColorBlindMode);

        var polyline = L.polyline(latlngs, {
            color: color,
            weight: 3
        });

        var popupContent = `
            <strong>Date:</strong> ${dataRow.date}<br>
            <strong>Magnitude:</strong> ${dataRow.mag}<br>
            <strong>Injuries:</strong> ${dataRow.inj}<br>
            <strong>Fatalities:</strong> ${dataRow.fat}<br>
            <strong>Length:</strong> ${dataRow.len} miles<br>
            <strong>Width:</strong> ${dataRow.wid} feet
        `;

        polyline.bindPopup(popupContent, {
            closeButton: false,
            offset: L.point(0, -20)
        });

        polyline.on('mouseover', function(e) {
            this.openPopup();
        });
        polyline.on('mouseout', function(e) {
            this.closePopup();
        });

        return polyline;
    } else {
        return null;
    }
}

function getColorBasedOnMagnitude(magnitude, isColorBlindMode) {
    if (isColorBlindMode) {
        switch (magnitude) {
            case 0: return 'yellow';   // Yellow
            case 1: return 'blue';     // Blue
            case 2: return 'teal';     // Teal
            case 3: return 'pink';     // Pink
            case 4: return 'orange';   // Orange
            case 5: return 'purple';   // Purple
            default: return 'gray';    // Gray for unexpected values
        }
    } else {
        switch (magnitude) {
            case 0: return 'blue';
            case 1: return '#00FF00'; // Bright green
            case 2: return 'orange';
            case 3: return 'yellow';
            case 4: return 'red';
            case 5: return 'purple';
            default: return 'gray';
        }
    }
}
