//Author: Ameya Deshmukh
//Date: 2024-02-20

// Load CSV file
d3.csv("national_health_data.csv").then(function(data) {

    // Attribute options
    var attributes = Object.keys(data[0]).filter(attr => attr !== "fips" && attr !== "county_name");

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


        // Prepare data for radar chart
        var radarChartData = prepareRadarChartData(data, selectedAttribute1, selectedAttribute2);
    
        // Define radar chart options
        var radarChartOptions = {
            w: 500, // Width of the chart
            h: 500, // Height of the chart
            margin: {top: 50, right: 100, bottom: 50, left: 100}, // Margins around the chart
            maxValue: 0.5, // Maximum value on the radar chart scale
            levels: 5, // How many concentric circles to draw
            roundStrokes: true, // If true, the outline will be round
            color: d3.scaleOrdinal(d3.schemeCategory10), // Color scheme
            format: '.2%', // Format for the axis labels
            legend: { position: 'right', x: 20, y: 20 } // Legend configuration
        };
  
        
        // Call RadarChart function
        RadarChart("#radarChart", radarChartData, radarChartOptions);
    }
});

function prepareRadarChartData(data, attribute1, attribute2) {
    // This function should transform your CSV data into the format expected by the RadarChart
    // For simplicity, let's assume a static set of attributes for comparison

    var attributesForRadar = ["poverty_perc", "median_household_income", "education_less_than_high_school_percent", "air_quality", "park_access"]; // Example attributes

    // Example transformation (simplified and should be adapted)
    var transformedData = attributesForRadar.map(attr => {
        return {
            name: attr, // Use attribute names as "name"
            axes: data.map(d => {
                return {
                    axis: d.county_name, // Assuming 'county_name' is available
                    value: +d[attr] // Ensure numeric value
                };
            })
        };
    });

    // For simplicity, assuming transformation results in the correct format
    // This part needs to be adjusted based on actual data structure and requirements
    return transformedData;
}

// Define color scale for choropleth maps
var colorScaleChoropleth = d3.scaleSequential(d3.interpolateBlues);

// Define color scale for other visualizations with a single color
var singleColor = "#ff7f0e"; // Change the color code as needed
// Define margins and dimensions for the chart globally
var margin = { top: 50, right: 50, bottom: 100, left: 100 };
var width = 1000;
var height = 600;
var innerWidth = width - margin.left - margin.right;
var innerHeight = height - margin.top - margin.bottom;

// Function to update distribution chart
function updateDistributionChart(data, attribute1, attribute2) {
    // Clear previous chart
    d3.select("#distribution-chart").selectAll("*").remove();

    // Check if both attributes are the same
    if (attribute1 === attribute2) {
        // If same, only display one histogram
        updateSingleHistogram(data, attribute1, attribute2);
    } else {
        // If different, display two side-by-side histograms
        updateDualHistograms(data, attribute1, attribute2);
    }

    // Define scales for x axes
    var xScale1 = d3.scaleLinear()
        .domain([d3.min(data, d => parseFloat(d[attribute1])), d3.max(data, d => parseFloat(d[attribute1]))])
        .range([margin.left, innerWidth / 2 - margin.right]);

    var xScale2 = d3.scaleLinear()
        .domain([d3.min(data, d => parseFloat(d[attribute2])), d3.max(data, d => parseFloat(d[attribute2]))])
        .range([innerWidth / 2 + margin.left, width - margin.right]);

    // Define brush for histogram
    var brushHistogram = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", function(event) {
            brushedHistogram(event, data, attribute1, attribute2, xScale1, xScale2);
        });

    // Append brush to histogram SVG
    d3.select("#distribution-chart svg").append("g")
        .attr("class", "brush")
        .call(brushHistogram);
}

// Function to handle brushing for histogram
function brushedHistogram(event, data, attribute1, attribute2, xScale1, xScale2) {
    if (!event.selection) return;

    // Extract x-coordinates of the brush selection
    var [x0, x1] = event.selection;

    // Filter data based on the brush selection
    var selectedData = data.filter(d => {
        var cx1 = xScale1(parseFloat(d[attribute1]));
        var cx2 = xScale2(parseFloat(d[attribute2]));
        return (cx1 >= x0 && cx1 <= x1) || (cx2 >= x0 && cx2 <= x1);
    });

    // Update scatterplot and choropleth maps
    updateScatterplot(selectedData, attribute1, attribute2);
    updateChoroplethMaps(selectedData, attribute1, attribute2);
}

// Function to update a single histogram
function updateSingleHistogram(data, attribute1, attribute2) {
    // Clear previous chart
    d3.select("#distribution-chart").selectAll("*").remove();

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
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            // Show tooltip
            tooltip.style("visibility", "visible")
                .html("Bar Value: " + d.length + "<br>Bar Range: [" + d.x0 + ", " + d.x1 + "]")
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.style("visibility", "hidden");
        });

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

    console.log("Width calculation in single histogram");

    // Append brushing functionality
    var brushHistogram = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", function(event) {
            brushedHistogram(event, xScale, data, attribute1);
        });

    // Append brush to SVG
    svg.append("g")
        .attr("class", "brush")
        .call(brushHistogram);
}

// Function to update two side-by-side histograms
function updateDualHistograms(data, attribute1, attribute2) {
    // Define the width and height of the chart
    var width = 1200;
    var height = 800;

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
        .attr("width", d => {
            const width = Math.abs(xScale1(d.x1) - xScale1(d.x0) - 1);
            console.log("Width of bar (Histogram 1): ", width);
            return width;
        })
        .attr("height", d => height - margin.bottom - yScale1(d.length))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            // Show tooltip
            tooltip.style("visibility", "visible")
                .html("Bar Value (Histogram 1): " + d.length + "<br>Bar Range (Histogram 1): [" + d.x0 + ", " + d.x1 + "]")
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.style("visibility", "hidden");
        });

    // Append bars for histogram 2
    svg.selectAll(".bar2")
        .data(bins2)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale2(d.x0))
        .attr("y", d => yScale2(d.length))
        .attr("width", d => {
            const width = Math.abs(xScale2(d.x1) - xScale2(d.x0) - 1);
            console.log("Width of bar (Histogram 2): ", width);
            return width;
        })
        .attr("height", d => height - margin.bottom - yScale2(d.length))
        .attr("fill", "orange")
        .on("mouseover", function(event, d) {
        // Show tooltip
            tooltip.style("visibility", "visible")
            .html("Bar Value (Histogram 2): " + d.length + "<br>Bar Range (Histogram 2): [" + d.x0 + ", " + d.x1 + "]")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.style("visibility", "hidden");
        });
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

    console.log("Width calculation in double histogram");

    // Append brushing functionality for both histograms
    var brushHistogram1 = d3.brushX()
        .extent([[margin.left, margin.top], [innerWidth / 2 - margin.right, height - margin.bottom]])
        .on("end", function(event) {
            brushedHistogram(event, xScale1, data, attribute1);
        });

    var brushHistogram2 = d3.brushX()
        .extent([[innerWidth / 2 + margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", function(event) {
            brushedHistogram(event, xScale2, data, attribute2);
        });

    // Append brush to SVG for histogram 1
    svg.append("g")
        .attr("class", "brush")
        .call(brushHistogram1);

    // Append brush to SVG for histogram 2
    svg.append("g")
        .attr("class", "brush")
        .call(brushHistogram2);


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
    var circles = svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(parseFloat(d[attribute1])))
        .attr("cy", d => yScale(parseFloat(d[attribute2])))
        .attr("r", 5)
        .attr("fill", 'green')
        .on("mouseover", function(event, d) {
            // Show tooltip with detail-on-demand interactions
            tooltip.style("visibility", "visible")
                .html("Attribute 1: " + d[attribute1] + "<br>Attribute 2: " + d[attribute2] + "<br>County: " + d.County)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.style("visibility", "hidden");
        });

    // Define brush
    var brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", brushed);

    // Append brush to SVG
    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Function to handle brushing
    function brushed(event) {
        if (!event.selection) return;

        // Extract coordinates of the brush selection
        var [[x0, y0], [x1, y1]] = event.selection;

        // Filter data based on the brush selection
        var selectedData = data.filter(d => {
            var cx = xScale(parseFloat(d[attribute1]));
            var cy = yScale(parseFloat(d[attribute2]));
            return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
        });

        // Update all visualizations to only show the selected counties
        updateDistributionChart(selectedData, attribute1, attribute2);
        updateChoroplethMaps(selectedData, attribute1, attribute2);
    }

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

function updateChoroplethMaps(data, attribute1, attribute2) {
    // Clear previous maps and legends
    clearPreviousElements();

    // Define the width and height of the maps
    var width = 1000;
    var height = 600;

    // Append SVG elements for the maps
    var svg1 = appendMap("#map1", width, height);
    var svg2 = appendMap("#map2", width, height);

    var path;

    // Load TopoJSON data for US counties
    d3.json("counties-10m.json").then(function(usCounties) {
        console.log("TopoJSON data loaded:", usCounties);

        // Define path function
        path = d3.geoPath().projection(d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000));

        // Define color scales
        var colorScale1 = d3.scaleSequential(d3.interpolateBlues);
        var colorScale2 = d3.scaleSequential(d3.interpolateReds);

        // Extract attribute values for scaling
        var values1 = data.map(d => parseFloat(d[attribute1]));
        var values2 = data.map(d => parseFloat(d[attribute2]));

        // Update domain of color scales based on attribute values
        colorScale1.domain([d3.min(values1), d3.max(values1)]);
        colorScale2.domain([d3.min(values2), d3.max(values2)]);

        // Draw the counties on the maps
        drawCounties(svg1, usCounties, data, attribute1, colorScale1, path);
        drawCounties(svg2, usCounties, data, attribute2, colorScale2, path);

        // Create legend for map 1
        createLegend(svg1, colorScale1, width, height, attribute1);

        // Create legend for map 2
        createLegend(svg2, colorScale2, width, height, attribute2);

        // Add brushing functionality
        addBrushing(svg1, data, attribute1, colorScale1, svg2, attribute2, colorScale2);
        addBrushing(svg2, data, attribute2, colorScale2, svg1, attribute1, colorScale1);

        console.log("SVG elements appended to maps.");
    }).catch(function(error) {
        console.log("Error loading TopoJSON data:", error);
    });

    // Function to clear previous elements
    function clearPreviousElements() {
        d3.select("#map1").selectAll("*").remove();
        d3.select("#map2").selectAll("*").remove();
        d3.select("#legend1").selectAll("*").remove();
        d3.select("#legend2").selectAll("*").remove();
    }

    // Function to append SVG elements for maps
    function appendMap(selector, width, height) {
        return d3.select(selector)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    // Function to draw the counties on the maps
    function drawCounties(svg, usCounties, data, attribute, colorScale, path) {
        svg.selectAll("path")
            .data(topojson.feature(usCounties, usCounties.objects.counties).features)
            .enter().append("path")
            .attr("class", "county")
            .attr("d", path)
            .attr("fill", function(d) {
                var countyData = data.find(entry => entry.cnty_fips === d.id);
                if (countyData) {
                    return colorScale(parseFloat(countyData[attribute]));
                } else {
                    // Handle missing data
                    return "gray";
                }
            });
    }

    // Function to add brushing functionality
    function addBrushing(svg, data, attribute, colorScale, linkedSvg, linkedAttribute, linkedColorScale) {
        var brush = d3.brush()
            .extent([[0, 0], [width, height]])
            .on("start brush end", function(event) {
                brushed(event, svg, data, attribute, colorScale, linkedSvg, linkedAttribute, linkedColorScale);
            });

        svg.append("g")
            .attr("class", "brush")
            .call(brush);
    }

    // Function to handle brushing
    function brushed(event, svg, data, attribute, colorScale, linkedSvg, linkedAttribute, linkedColorScale) {
        var extent = event.selection;
        if (!extent) return;

        // Get selected counties
        var selectedCounties = [];
        d3.selectAll(".county").each(function(d) {
            var centroid = path.centroid(d);
            if (extent[0][0] <= centroid[0] && centroid[0] <= extent[1][0] &&
                extent[0][1] <= centroid[1] && centroid[1] <= extent[1][1]) {
                selectedCounties.push(d.id);
            }
        });

        // Filter data based on selected counties
        var filteredData = data.filter(function(d) {
            return selectedCounties.includes(d.cnty_fips);
        });

        // Update choropleth maps with filtered data
        updateMaps(svg, filteredData, attribute, colorScale);
        updateMaps(linkedSvg, filteredData, linkedAttribute, linkedColorScale);
        // Update scatterplot
        updateScatterplot(filteredData, attribute1, attribute2);

        // Update distribution chart
        updateDistributionChart(filteredData, attribute1, attribute2);
    }

    // Function to update choropleth maps
    function updateMaps(svg, data, attribute, colorScale) {
        // Update fill color of counties
        svg.selectAll(".county")
            .attr("fill", function(d) {
                var countyData = data.find(entry => entry.cnty_fips === d.id);
                if (countyData) {
                    return colorScale(parseFloat(countyData[attribute]));
                } else {
                    // Handle missing data
                    return "gray";
                }
            });
    }
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

// Example code for creating a basic time series chart
// Radar Chart Constructor
function RadarChart(parent_selector, data, options) {
    const cfg = {
        w: 600, // Width of the circle
        h: 600, // Height of the circle
        margin: {top: 20, right: 20, bottom: 20, left: 20}, // The margins of the SVG
        levels: 3, // How many levels or inner circles should there be drawn
        maxValue: 0, // What is the value that the biggest circle will represent
        labelFactor: 1.25, // How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, // The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, // The opacity of the area of the blob
        dotRadius: 4, // The size of the colored circles of each blog
        opacityCircles: 0.1, // The opacity of the circles of each blob
        strokeWidth: 2, // The width of the stroke around each blob
        roundStrokes: false, // If true the area and stroke will follow a round path (cardinal-closed)
        color: d3.scaleOrdinal(d3.schemeCategory10) // Color function
    };

    // Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) { cfg[i] = options[i]; }
        }
    }

    // If the supplied maxValue is smaller than the actual one, replace by the max in the data
    let maxValue = Math.max(cfg.maxValue, d3.max(data, d => d3.max(d.axes, o => o.value)));

    const allAxis = data[0].axes.map((i, j) => i.axis), // Names of each axis
        total = allAxis.length, // The number of different axes
        radius = Math.min(cfg.w / 2, cfg.h / 2), // Radius of the outermost circle
        Format = d3.format('%'), // Percentage formatting
        angleSlice = Math.PI * 2 / total; // The width in radians of each "slice"

    // Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    // Remove whatever chart with the same id/class was present before
    d3.select(parent_selector).select("svg").remove();

    // Initiate the radar chart SVG
    const svg = d3.select(parent_selector).append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar" + parent_selector);
    const g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    // Glow filter for some extra pizzazz
    const filter = g.append('defs').append('filter').attr('id', 'glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw the Circular grid
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter", "url(#glow)");

    // Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(d => Format(maxValue * d / cfg.levels) + cfg.unit);

    // Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    // Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    // The radar chart function
    const radarLine = d3.radialLine()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    if (cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed);
    }

    // Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    // Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d.axes))
        .style("fill", (d, i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function (d, i) {
            // Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            // Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', () => {
            // Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    // Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d) { return radarLine(d.axes); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d, i) => cfg.color(i))
        .style("fill", "none")
        .style("filter", "url(#glow)");

    // Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", (d, i, j) => cfg.color(j))
        .style("fill-opacity", 0.8);

    // Wrapper for the invisible circles on top for the tooltip
    const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    // Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(d) {
            tooltip
                .attr('x', this.cx.baseVal.value - 10)
                .attr('y', this.cy.baseVal.value - 10)
                .transition()
                .style('display', 'block')
                .text(Format(d.value));
        })
        .on("mouseout", function(){
            tooltip.transition()
                .style('display', 'none').text('');
        });

    const tooltip = g.append("text")
        .attr("class", "tooltip")
        .attr('x', 0)
        .attr('y', 0)
        .style("font-size", "12px")
        .style('display', 'none')
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em");

    // Helper Function to wrap SVG text (for axis labels)
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
}


// Create tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px");



