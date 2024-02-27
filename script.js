// Load CSV file
d3.csv("national_health_data.csv").then(function(data) {
    // Attribute options
    var attributes = Object.keys(data[0]).filter(attr => !["fips", "county_name"].includes(attr));

    // Populate attribute dropdowns
    var attributeDropdown1 = d3.select("#attribute1");
    var attributeDropdown2 = d3.select("#attribute2");

    attributes.forEach(attr => {
        attributeDropdown1.append("option").attr("value", attr).text(attr);
        attributeDropdown2.append("option").attr("value", attr).text(attr);
    });

    // Add event listeners for attribute selection
    attributeDropdown1.on("change", updateVisualization);
    attributeDropdown2.on("change", updateVisualization);

    // Initial visualization update
    updateVisualization();

    function updateVisualization() {
        var selectedAttribute1 = attributeDropdown1.property("value");
        var selectedAttribute2 = attributeDropdown2.property("value");

        // Call functions to update each visualization
        updateDistributionChart(data, selectedAttribute1, selectedAttribute2);
        updateScatterplot(data, selectedAttribute1, selectedAttribute2);
        updateChoroplethMaps(data, selectedAttribute1, selectedAttribute2);
    }
});

// Define color scale for choropleth maps
var colorScaleChoropleth = d3.scaleSequential(d3.interpolateBlues);

// Define color scale for other visualizations with a single color
var singleColor = "#ff7f0e"; // Change the color code as needed

// Function to update distribution chart
function updateDistributionChart(data, attribute1, attribute2) {
    // Clear previous chart
    d3.select("#distribution-chart").selectAll("*").remove();

    // Check if both attributes are the same
    if (attribute1 === attribute2) {
        // If same, only display one histogram
        updateSingleHistogram(data, attribute1);
    } else {
        // If different, display two side-by-side histograms
        updateDualHistograms(data, attribute1, attribute2);
    }
}

// Function to update a single histogram
function updateSingleHistogram(data, attribute1) {
    // Clear previous chart
    d3.select("#distribution-chart").selectAll("*").remove();

    // Define the width and height of the chart
    var width = 1000;
    var height = 600;

    // Define margins and dimensions for the chart
    var margin = { top: 50, right: 50, bottom: 100, left: 100 };
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    // Create SVG element for the chart
    var svg = d3.select("#distribution-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Extract numeric values for the selected attribute
    var xValues = data.map(d => parseFloat(d[attribute1]));

    // Define scales for x and y axes
    var xScale = d3.scaleLinear()
        .domain([d3.min(xValues), d3.max(xValues)])
        .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(xValues)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Create histogram function
    var histogram = d3.histogram()
        .value(d => parseFloat(d[attribute1]))
        .domain(xScale.domain())
        .thresholds(xScale.ticks(20));

    // Calculate bin data
    var bins = histogram(data);

    // Define y axis
    var yAxis = d3.axisLeft(yScale);

    // Append x axis
    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(d3.axisBottom(xScale));

    // Append y axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);

    // Append bars for the histogram
    svg.selectAll(".bar")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => Math.abs(xScale(d.x1) - xScale(d.x0) - 1))
        .attr("height", d => height - margin.bottom - yScale(d.length))
        .attr("fill", "steelblue");

    // Create x-axis label
    svg.append("text")
        .attr("transform", "translate(" + (margin.left + innerWidth / 2) + " ," + (height - margin.bottom + 40) + ")")
        .style("text-anchor", "middle")
        .text(attribute1);

    // Create y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 2)
        .attr("x", 0 - (margin.top + innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Frequency");
}

// Function to update two side-by-side histograms
function updateDualHistograms(data, attribute1, attribute2) {
    // Define the width and height of the chart
    var width = 1000;
    var height = 600;

    // Define margins and dimensions for the chart
    var margin = { top: 50, right: 50, bottom: 100, left: 100 };
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    // Create SVG element for the chart
    var svg = d3.select("#distribution-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Extract numeric values for the selected attributes
    var xValues1 = data.map(d => parseFloat(d[attribute1]));
    var xValues2 = data.map(d => parseFloat(d[attribute2]));

    // Define scales for x axes
    var xScale1 = d3.scaleLinear()
        .domain([d3.min(xValues1), d3.max(xValues1)])
        .range([margin.left, innerWidth / 2 - margin.right]);

    var xScale2 = d3.scaleLinear()
        .domain([d3.min(xValues2), d3.max(xValues2)])
        .range([innerWidth / 2 + margin.left, width - margin.right]);

    // Define histogram functions
    var histogram1 = d3.histogram()
        .value(d => parseFloat(d[attribute1]))
        .domain(xScale1.domain())
        .thresholds(xScale1.ticks(20));

    var histogram2 = d3.histogram()
        .value(d => parseFloat(d[attribute2]))
        .domain(xScale2.domain())
        .thresholds(xScale2.ticks(20));

    // Calculate bin data
    var bins1 = histogram1(data);
    var bins2 = histogram2(data);

    // Define scales for y axes
    var yScale1 = d3.scaleLinear()
        .domain([0, d3.max(bins1, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    var yScale2 = d3.scaleLinear()
        .domain([0, d3.max(bins2, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    // Define axes
    var xAxis1 = d3.axisBottom(xScale1);
    var xAxis2 = d3.axisBottom(xScale2);
    var yAxis1 = d3.axisLeft(yScale1);
    var yAxis2 = d3.axisLeft(yScale2);

    // Append x axes
    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(xAxis1);

    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(xAxis2);

    // Append y axes
    svg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis1);

    svg.append("g")
        .attr("transform", "translate(" + (innerWidth / 2 + margin.left) + ",0)")
        .call(yAxis2);

    // Append bars for histogram 1
    svg.selectAll(".bar1")
        .data(bins1)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale1(d.x0))
        .attr("y", d => yScale1(d.length))
        .attr("width", d => Math.abs(xScale1(d.x1) - xScale1(d.x0) - 1))
        .attr("height", d => height - margin.bottom - yScale1(d.length))
        .attr("fill", "steelblue");

    // Append bars for histogram 2
    svg.selectAll(".bar2")
        .data(bins2)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale2(d.x0))
        .attr("y", d => yScale2(d.length))
        .attr("width", d => Math.abs(xScale2(d.x1) - xScale2(d.x0) - 1))
        .attr("height", d => height - margin.bottom - yScale2(d.length))
        .attr("fill", "steelblue");

    // Create x-axis labels
    svg.append("text")
        .attr("transform", "translate(" + (innerWidth / 4) + " ," + (height - margin.bottom / 2) + ")")
        .style("text-anchor", "middle")
        .text(attribute1);

    svg.append("text")
        .attr("transform", "translate(" + (3 * innerWidth / 4) + " ," + (height - margin.bottom / 2) + ")")
        .style("text-anchor", "middle")
        .text(attribute2);

    // Create y-axis labels
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 2)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Frequency");
}

// Function to update scatterplot
function updateScatterplot(data, attribute1, attribute2) {
    // Clear previous scatterplot
    d3.select("#scatterplot").selectAll("*").remove();

    // Define the width and height of the scatterplot
    var width = 1000;
    var height = 600;

    // Define margins and dimensions for the chart
    var margin = {top: 50, right: 50, bottom: 50, left: 50};
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    // Create SVG element for the scatterplot
    var svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Extract numeric values for the selected attributes
    var xValues = data.map(d => parseFloat(d[attribute1]));
    var yValues = data.map(d => parseFloat(d[attribute2]));

    // Define scales for x and y axes
    var xScale = d3.scaleLinear()
        .domain([d3.min(xValues), d3.max(xValues)])
        .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
        .domain([d3.min(yValues), d3.max(yValues)])
        .range([height - margin.bottom, margin.top]);

    // Create circles for the scatterplot
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(parseFloat(d[attribute1])))
        .attr("cy", d => yScale(parseFloat(d[attribute2])))
        .attr("r", 5)
        .attr("fill", singleColor);

    // Create x-axis
    var xAxis = d3.axisBottom(xScale);
    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(xAxis);

    // Create y-axis
    var yAxis = d3.axisLeft(yScale);
    svg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);

    // Create x-axis label
    svg.append("text")
        .attr("transform", "translate(" + (margin.left + innerWidth / 2) + " ," + (height - margin.bottom + 40) + ")")
        .style("text-anchor", "middle")
        .text(attribute1);

    // Create y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 2)
        .attr("x", 0 - (margin.top + innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(attribute2);
}

// Function to update choropleth maps with legend
function updateChoroplethMaps(data, attribute1, attribute2) {
    // Clear previous maps and legends
    d3.select("#map1").selectAll("*").remove();
    d3.select("#map2").selectAll("*").remove();
    d3.select("#legend1").selectAll("*").remove();
    d3.select("#legend2").selectAll("*").remove();

    // Define the width and height of the maps
    var width = 1000;
    var height = 600;

    // Append SVG elements for the maps
    var svg1 = d3.select("#map1")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var svg2 = d3.select("#map2")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load TopoJSON data for US counties
    d3.json("counties-10m.json").then(function(usCounties) {
        // Draw the counties on the maps using TopoJSON data
        var path = d3.geoPath().projection(d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000));

        // Extract attribute values for scaling
        var values1 = data.map(d => parseFloat(d[attribute1]));
        var values2 = data.map(d => parseFloat(d[attribute2]));

        // Define color scales
        var colorScale1 = d3.scaleSequential(d3.interpolateBlues).domain([d3.min(values1), d3.max(values1)]);
        var colorScale2 = d3.scaleSequential(d3.interpolateReds).domain([d3.min(values2), d3.max(values2)]);

        svg1.selectAll("path")
            .data(topojson.feature(usCounties, usCounties.objects.counties).features)
            .enter().append("path")
            .attr("class", "county")
            .attr("d", path)
            .attr("fill", function(d) {
                var countyData = data.find(entry => entry.cnty_fips === d.id);
                if (countyData) {
                    return colorScale1(parseFloat(countyData[attribute1]));
                } else {
                    // Handle missing data
                    return "gray";
                }
            });

        svg2.selectAll("path")
            .data(topojson.feature(usCounties, usCounties.objects.counties).features)
            .enter().append("path")
            .attr("class", "county")
            .attr("d", path)
            .attr("fill", function(d) {
                var countyData = data.find(entry => entry.cnty_fips === d.id);
                if (countyData) {
                    return colorScale2(parseFloat(countyData[attribute2]));
                } else {
                    // Handle missing data
                    return "gray";
                }
            });

        // Create legend for map 1
        createLegend(svg1, colorScale1, width, height, attribute1);

        // Create legend for map 2
        createLegend(svg2, colorScale2, width, height, attribute2);
    }).catch(function(error) {
        console.log("Error loading TopoJSON data:", error);
    });
}

// Function to create legend
function createLegend(svg, colorScale, width, height, attribute) {
    var legend = svg.append("g")
        .attr("class", "legend");

    // Add attribute label to the legend
    legend.append("text")
        .attr("class", "legend-label")
        .attr("x", 10) // Adjust x-coordinate as needed
        .attr("y", 20) // Adjust y-coordinate as needed
        .text("Attribute: " + attribute);

    // Adjust positioning based on legend width and height
    var legendWidth = legend.node().getBoundingClientRect().width;
    var legendHeight = legend.node().getBoundingClientRect().height;
    legend.attr("transform", "translate(" + (width - legendWidth - 20) + "," + (height - legendHeight - 20) + ")");
}

// Create tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("padding", "5px")
    .style("border", "1px solid #000")
    .text("");

// Add mouseover and mouseout events to the scatterplot circles
d3.select("#scatterplot").selectAll("circle")
    .on("mouseover", function(d) {
        tooltip.text(d.county_name + ": " + d[attribute1] + ", " + d[attribute2]);
        tooltip.style("visibility", "visible");
    })
    .on("mousemove", function() {
        tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
    });
