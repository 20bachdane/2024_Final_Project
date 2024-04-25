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
    var stamenLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>',

    });
     var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | Data source: <a href="https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS">World Bank</a>'
    });
    var worldLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    var Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {

        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    });


    // Add default tile layer (OSM)
    stamenLayer.addTo(map);

    // Add layer control to toggle between layers
    var baseLayers = {
        "Stamen Terrain": stamenLayer,
        "OpenStreetMap": osmLayer,
        "World Imagery": worldLayer,
        "Satellite": Stadia_AlidadeSatellite,
        
    };

    L.control.layers(baseLayers).addTo(map);
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
            return L.polyline(latlngs, { color: 'red' });
        } else {
            // If no end coordinates, return null
            return null;
        }
    }

// Function to load and process the CSV data
function loadCSVData() {
    fetch('data/1950-2022_torn.csv')
        .then(response => response.text())
        .then(csvText => {
            // Split the CSV text by new line and take the first 101 lines (including header)
            var lines = csvText.split('\n').slice(0, 101);
            // Join the selected lines back into a single string
            var firstHundredLines = lines.join('\n');
            // Parse the CSV string
            var data = Papa.parse(firstHundredLines, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            }).data;
            
            // Process the data
            data.forEach(function(dataRow) {
                var polyline = createPolyline(dataRow);
                if (polyline) {
                    polyline.addTo(map); // Add the polyline to the map
                }
            });
        })
        .catch(error => console.error("Error loading CSV data:", error));
}


    // Call the function to load and process CSV data
    loadCSVData();


