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
    // Create a container div for year filter
    var yearFilterDiv = document.createElement('div');
    yearFilterDiv.className = 'filter-container'; // You can add a class for styling if needed

    // Label for the year filter
    var yearFilterLabel = document.createElement('label');
    yearFilterLabel.textContent = 'Filter by year:';
    yearFilterLabel.style.fontWeight = 'bold';
    yearFilterDiv.appendChild(yearFilterLabel);

    // Select for the minimum year
    var minYearSelect = document.createElement('select');
    minYearSelect.id = 'minYearSelect';
    yearFilterDiv.appendChild(minYearSelect);

    // "To" between the dropdowns
    var toLabel = document.createElement('span');
    toLabel.textContent = ' to ';
    yearFilterDiv.appendChild(toLabel);

    // Select for the maximum year
    var maxYearSelect = document.createElement('select');
    maxYearSelect.id = 'maxYearSelect';
    yearFilterDiv.appendChild(maxYearSelect);

    // Populate both year selects
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
    minYearSelect.value = 2020;
    // Set a default value for the maximum year to the latest year
    maxYearSelect.value = 2022;

    // Event listeners for changes
    minYearSelect.addEventListener('change', function() {
        loadCSVData(); // Reload CSV and update map based on the new year selection
    });

    maxYearSelect.addEventListener('change', function() {
        loadCSVData(); // Reload CSV and update map based on the new year selection
    });

    // Append the year filter container to the controlDiv
    controlDiv.appendChild(yearFilterDiv);
}


function createMonthDropdown(controlDiv) {
    // Create a container div for month filter
    var monthFilterDiv = document.createElement('div');
    monthFilterDiv.className = 'filter-container'; // You can add a class for styling if needed

    // Label for the month filter
    var monthFilterLabel = document.createElement('label');
    monthFilterLabel.textContent = 'Filter by month:';
    monthFilterLabel.style.fontWeight = 'bold';
    monthFilterDiv.appendChild(monthFilterLabel);

    // Select for the minimum month
    var minMonthSelect = document.createElement('select');
    minMonthSelect.id = 'minMonthSelect';
    monthFilterDiv.appendChild(minMonthSelect);

    // "To" between the dropdowns
    var toLabel = document.createElement('span');
    toLabel.textContent = ' to ';
    monthFilterDiv.appendChild(toLabel);

    // Select for the maximum month
    var maxMonthSelect = document.createElement('select');
    maxMonthSelect.id = 'maxMonthSelect';
    monthFilterDiv.appendChild(maxMonthSelect);

    // Populate both month selects
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    months.forEach(function(month, index) {
        let minOption = document.createElement('option');
        minOption.value = index + 1;  // Assuming the "mo" column is 1-indexed
        minOption.textContent = month;
        minMonthSelect.appendChild(minOption);

        let maxOption = document.createElement('option');
        maxOption.value = index + 1;
        maxOption.textContent = month;
        maxMonthSelect.appendChild(maxOption);
    });

    // Set a default value for the maximum month to the last month
    maxMonthSelect.value = 12;

    // Event listeners for changes
    minMonthSelect.addEventListener('change', function() {
        loadCSVData(); // Reload CSV and update map based on the new month selection
    });

    maxMonthSelect.addEventListener('change', function() {
        loadCSVData(); // Reload CSV and update map based on the new month selection
    });

    // Append the month filter container to the controlDiv
    controlDiv.appendChild(monthFilterDiv);
}

function createColorBlindModeCheckbox(controlDiv) {
    // Create a container div for color blind mode
    var colorBlindModeDiv = document.createElement('div');
    colorBlindModeDiv.className = 'filter-container'; // You can add a class for styling if needed

    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'colorBlindModeCheckbox';
    checkbox.addEventListener('change', loadCSVData); // Re-load data when the mode is toggled

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' Color Blind Mode'));
    colorBlindModeDiv.appendChild(label);

    // Append the color blind mode container to the controlDiv
    controlDiv.appendChild(colorBlindModeDiv);
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
