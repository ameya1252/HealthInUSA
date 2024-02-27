const dataFile = "national_health_data.csv";
const geoJsonFile = "us.json"; // Path to your TopoJSON file

// Selected attributes
let selectedAttribute1, selectedAttribute2;

// Load both the CSV data and the TopoJSON file concurrently
Promise.all([
    d3.csv(dataFile),
    d3.json(geoJsonFile)
]).then(files => {
    const data = files[0]; // The first file is your CSV data
    const topoJsonData = files[1]; // The second file is your TopoJSON data

    console.log('Data loaded successfully:', data);
    console.log('TopoJSON loaded successfully:', topoJsonData);

    // Convert TopoJSON to GeoJSON
    const usGeoJson = topojson.feature(topoJsonData, topoJsonData.objects.counties);

    console.log(usGeoJson); // Check the GeoJSON data

    // Data preprocessing
    data.forEach(d => {
        // Convert string values to numbers where necessary
        for (const key in d) {
            if (key !== 'fips') {
                d[key] = +d[key];
            }
        }
    });

    // Initialize attribute selection UI
    initializeAttributeSelection(data);

    // Update the visualization creation calls
    createHistograms(data);
    createScatterplot(data);
    // Ensure you pass the converted GeoJSON here
    createChoroplethMaps(data, usGeoJson, selectedAttribute1, selectedAttribute2);
}).catch(error => {
    console.log('Error loading the data:', error);
});


// Updated Function to initialize attribute selection UI
function initializeAttributeSelection(data) {
    const attributes = Object.keys(data[0]).filter(attr => attr !== 'fips');

    // Populate attribute selection dropdowns
    const attributeDropdown1 = d3.select('#attribute1');
    const attributeDropdown2 = d3.select('#attribute2');

    // Append options to the dropdowns
    attributeDropdown1.selectAll('option')
        .data(attributes)
        .enter()
        .append('option')
        .attr('value', function(d) { return d; })
        .text(function(d) { return d; });

    attributeDropdown2.selectAll('option')
        .data(attributes)
        .enter()
        .append('option')
        .attr('value', function(d) { return d; })
        .text(function(d) { return d; });

    // Setup initial selection values
    if (attributes.length > 0) {
        selectedAttribute1 = attributes[0];
        if (attributes.length > 1) {
            selectedAttribute2 = attributes[1]; // Assuming there's at least two attributes
        } else {
            selectedAttribute2 = attributes[0];
        }
    }

    // Listen to changes in dropdown selections
    attributeDropdown1.on('change', function(event) {
        selectedAttribute1 = d3.select(this).property('value');
        updateVisualizations(data);
    });

    attributeDropdown2.on('change', function(event) {
        selectedAttribute2 = d3.select(this).property('value');
        updateVisualizations(data);
    });

    // Initial visualization update
    updateVisualizations(data);
}

// Function to update visualizations based on selected attributes
function updateVisualizations(data) {
    // Update histograms
    updateHistograms(data);

    // Update scatterplot
    updateScatterplot(data);

    // Update choropleth maps
    updateChoroplethMaps(data);
}

// Function to update histograms based on selected attributes
function updateHistograms(data) {
    // Remove any existing histograms
    d3.selectAll('#histogram-container svg').remove();

    // Create new histograms
    createHistograms(data);
}

// Function to update scatterplot based on selected attributes
function updateScatterplot(data) {
    // Remove any existing scatterplot
    d3.selectAll('#scatterplot-container svg').remove();

    // Create new scatterplot
    createScatterplot(data);
}

// Function to update choropleth maps based on selected attributes
function updateChoroplethMaps(data, usGeoJson, attribute1, attribute2) {
    // Remove any existing choropleth maps
    d3.selectAll('#choropleth-container svg').remove();

    // Create new choropleth maps with the updated attributes
    createChoroplethMaps(data, usGeoJson, attribute1, attribute2);
}


// Function to create histograms for selected attributes
function createHistograms(data) {
    // Select the attributes for which histograms will be created
    const selectedAttributes = [selectedAttribute1, selectedAttribute2];

    // Define the dimensions and margins for the histograms
    const margin = { top: 40, right: 50, bottom: 70, left: 50 }; // Increased bottom margin for axis labels
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create a histogram for each selected attribute
    selectedAttributes.forEach((attribute, index) => {
        const values = data.map(d => d[attribute]);

        // Create SVG element for histogram
        const svg = d3.select('#histogram-container')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Define x scale
        const x = d3.scaleLinear()
            .domain(d3.extent(values))
            .range([0, width]);

        // Generate histogram bins
        const bins = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(10))
            (values);

        // Define y scale
        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height, 0]);

        // Create bars for histogram
        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', d => x(d.x0) + 1)
            .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr('y', d => y(d.length))
            .attr('height', d => height - y(d.length))
            .style('fill', index === 0 ? '#2196F3' : '#FF9800'); // Blue for first histogram, Orange for second

        // Add x-axis
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Add y-axis
        svg.append('g')
            .call(d3.axisLeft(y));

        // Add x-axis label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom / 2)
            .style('text-anchor', 'middle')
            .text(attribute);

        // Add y-axis label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left / 1.5)
            .style('text-anchor', 'middle')
            .text('Frequency');
    });
}

// Function to create scatterplot for selected attributes
function createScatterplot(data) {
    // Select the attributes for which scatterplot will be created
    const attributeX = selectedAttribute1;
    const attributeY = selectedAttribute2;

    // Define dimensions and margins for scatterplot
    const margin = { top: 40, right: 50, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG element for scatterplot
    const svg = d3.select('#scatterplot-container')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define x scale
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d[attributeX]))
        .range([0, width]);

    // Define y scale
    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d[attributeY]))
        .range([height, 0]);

    // Add dots for scatterplot
    svg.selectAll('dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d[attributeX]))
        .attr('cy', d => y(d[attributeY]))
        .attr('r', 5)
        .style('fill', '#4CAF50'); // Set scatterplot points to green

    // Add x-axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append('g')
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom / 2)
        .style('text-anchor', 'middle')
        .text(attributeX);

    // Add y-axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left / 1.5)
        .style('text-anchor', 'middle')
        .text(attributeY);
}

// Function to create choropleth maps for selected attributes
function createChoroplethMaps(data, usGeoJson, attribute1, attribute2) {
    // Define the dimensions and margins for the maps
    const width = 960; // Total width for both maps including margins
    const height = 500;
    const margin = { top: 50, right: 20, bottom: 50, left: 20 };

    // Calculate individual map dimensions
    const mapWidth = (width / 2) - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    // Define color scales for each attribute
    const colorScale1 = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(data, d => d[attribute1]));
    const colorScale2 = d3.scaleSequential(d3.interpolatePurples)
        .domain(d3.extent(data, d => d[attribute2]));

    // Initialize SVG container for the maps
    const svg = d3.select('#choropleth-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Define a projection and path generator for the maps
    const projection = d3.geoAlbersUsa()
        .translate([width / 4, height / 2]) // Center the map in the first half
        .scale([1000]);
    const path = d3.geoPath().projection(projection);

    // Function to draw maps
    const drawMap = (svg, geoJson, colorScale, attribute, translateX) => {
        svg.append('g')
            .attr('transform', `translate(${translateX},0)`)
            .selectAll('path')
            .data(geoJson.features)
            .enter().append('path')
            .attr('d', path)
            .attr('fill', d => {
                const dataItem = data.find(item => item.id === d.id);
                return dataItem ? colorScale(dataItem[attribute]) : '#ccc';
            })
            .attr('stroke', '#fff');

        // Add title for each map
        svg.append('text')
            .attr('x', translateX + mapWidth / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text(`Choropleth Map for ${attribute}`);
    };

    // Draw the maps
    drawMap(svg, usGeoJson, colorScale1, attribute1, margin.left);
    drawMap(svg, usGeoJson, colorScale2, attribute2, width / 2 + margin.left);
}

// Function to draw a choropleth map on the provided SVG element
function drawMap(svg, usGeoJson, colorScale, attribute, xOffset) {
    const mapWidth = svg.attr('width') / 2;
    const mapHeight = svg.attr('height');

    // Create a projection for the map
    const projection = d3.geoAlbersUsa()
        .fitSize([mapWidth, mapHeight], usGeoJson);

    // Create a path generator
    const path = d3.geoPath()
        .projection(projection);

    // Draw the map
    svg.selectAll('path')
        .data(usGeoJson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('transform', `translate(${xOffset}, 0)`) // Position the map using xOffset
        .attr('fill', d => {
            const dataValue = d.properties[attribute];
            return dataValue ? colorScale(dataValue) : '#ccc';
        });

    // Optionally, add map labels or legends here
}

