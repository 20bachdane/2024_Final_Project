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
    });
     var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | Data source: <a href="https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS">World Bank</a>'
    });

   


    // Add default tile layer (OSM)
    worldLayer.addTo(map);

    // Add layer control to toggle between layers
    var baseLayers = {
        "World Imagery": worldLayer,
        "OpenStreetMap": osmLayer
        
    };

    L.control.layers(baseLayers).addTo(map);

    var controlDiv = document.getElementById('controls');
    if (!controlDiv) {
        controlDiv = document.createElement('div');
        controlDiv.id = 'controls';
        document.body.appendChild(controlDiv); // Append controls to the body or a specific container
    }

    // Year range setup
    createYearInput(controlDiv);
    // Month selection dropdown setup
    createMonthDropdown(controlDiv);

    loadCSVData();
}

function createYearInput(controlDiv) {
    // Label for the minimum year select
    var minYearLabel = document.createElement('label');
    minYearLabel.setAttribute('for', 'minYearSelect');
    minYearLabel.textContent = 'Select Minimum Year:';
    controlDiv.appendChild(minYearLabel);

    // Select for the minimum year
    var minYearSelect = document.createElement('select');
    minYearSelect.id = 'minYearSelect';
    controlDiv.appendChild(minYearSelect);

    // Label for the maximum year select
    var maxYearLabel = document.createElement('label');
    maxYearLabel.setAttribute('for', 'maxYearSelect');
    maxYearLabel.textContent = 'Select Maximum Year:';
    controlDiv.appendChild(maxYearLabel);

    // Select for the maximum year
    var maxYearSelect = document.createElement('select');
    maxYearSelect.id = 'maxYearSelect';
    controlDiv.appendChild(maxYearSelect);

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
    minYearSelect.value = 2020
    // Set a default value for the maximum year to the latest year
    maxYearSelect.value = 2022;

    // Event listeners for changes
    minYearSelect.addEventListener('change', function() {
        loadCSVData(); // Reload CSV and update map based on the new year selection
    });

    maxYearSelect.addEventListener('change', function() {
        loadCSVData(); // Reload CSV and update map based on the new year selection
    });
}

function createMonthDropdown(controlDiv) {
    // Label for the minimum month select
    var minMonthLabel = document.createElement('label');
    minMonthLabel.setAttribute('for', 'minMonthSelect');
    minMonthLabel.textContent = 'Select Minimum Month:';
    controlDiv.appendChild(minMonthLabel);

    // Select for the minimum month
    var minMonthSelect = document.createElement('select');
    minMonthSelect.id = 'minMonthSelect';
    controlDiv.appendChild(minMonthSelect);

    // Label for the maximum month select
    var maxMonthLabel = document.createElement('label');
    maxMonthLabel.setAttribute('for', 'maxMonthSelect');
    maxMonthLabel.textContent = 'Select Maximum Month:';
    controlDiv.appendChild(maxMonthLabel);

    // Select for the maximum month
    var maxMonthSelect = document.createElement('select');
    maxMonthSelect.id = 'maxMonthSelect';
    controlDiv.appendChild(maxMonthSelect);

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
}

function updateYearRangeLabel(minYear, maxYear) {
    document.getElementById('yearRangeLabel').textContent = `${minYear} - ${maxYear}`;
}
    // Function to handle parsing CSV data
    function parseCSVData(csvData) {
        var parsedData = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        console.log(parsedData.data)
        return parsedData.data;
    }

    // Function to create polyline from CSV data row
    function createPolyline(dataRow) {
        // Check if end coordinates exist
        if (dataRow.elat && dataRow.elon) {
            var latlngs = [
                [dataRow.slat, dataRow.slon],
                [dataRow.elat, dataRow.elon]
            ];
            var polyline = L.polyline(latlngs, { color: 'red' });
     
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
            // If no end coordinates, return null
            return null;
        }
    }

// Function to load and process the CSV data
var allPolylines = []; // Store all polyline layers for later manipulation

function loadCSVData() {
    var minYear = document.getElementById('minYearSelect') ? parseInt(document.getElementById('minYearSelect').value) : 2020;
    var maxYear = document.getElementById('maxYearSelect') ? parseInt(document.getElementById('maxYearSelect').value) : 2022;
    var minMonth = document.getElementById('minMonthSelect') ? parseInt(document.getElementById('minMonthSelect').value) : 1;
    var maxMonth = document.getElementById('maxMonthSelect') ? parseInt(document.getElementById('maxMonthSelect').value) : 12;

    fetch('data/1950-2022_torn.csv').then(response => response.text()).then(csvText => {
        var data = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        updateMap(data, minYear, maxYear, minMonth, maxMonth);
    }).catch(error => {
        console.error("Error loading CSV data:", error);
    });
}

function updateMap(data) {
    clearMap();
    var minYear = parseInt(document.getElementById('minYearSelect').value);
    var maxYear = parseInt(document.getElementById('maxYearSelect').value);
    var minMonth = parseInt(document.getElementById('minMonthSelect').value);
    var maxMonth = parseInt(document.getElementById('maxMonthSelect').value);

    data.filter(row => row.yr >= minYear && row.yr <= maxYear && row.mo >= minMonth && row.mo <= maxMonth)
        .forEach(function(dataRow) {
            var polyline = createPolyline(dataRow);
            if (polyline) {
                polyline.addTo(map);
                allPolylines.push(polyline);
            }
        });
}

function clearMap() {
    allPolylines.forEach(polyline => {
        map.removeLayer(polyline);
    });
    allPolylines = [];
}



    // Call the function to load and process CSV data
    loadCSVData();


