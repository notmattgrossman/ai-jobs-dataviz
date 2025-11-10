// Industry Outlook Horizontal Stacked Bar Chart
d3.csv("data/4. Economy/Data/fig_4.4.12.csv").then(function(data) {
    // Parse percentage values
    data.forEach(function(d) {
        d.percentage = parseFloat(d["% of respondents"]);
    });

    // Get unique functions and responses
    const allFunctions = [...new Set(data.map(d => d.Function))];
    const responses = [
        "Increase by >20%",
        "Increase by 11–20%",
        "Increase by 3–10%",
        "Little or no change",
        "Don't know",
        "Decrease by 3–10%",
        "Decrease by 11–20%",
        "Decrease by >20%"
    ];

    // Calculate positivity score for each function
    // Positive weights for increases, negative for decreases, 0 for neutral
    const responseWeights = {
        "Increase by >20%": 2.0,
        "Increase by 11–20%": 1.5,
        "Increase by 3–10%": 1.0,
        "Little or no change": 0,
        "Don't know": 0,
        "Decrease by 3–10%": -1.0,
        "Decrease by 11–20%": -1.5,
        "Decrease by >20%": -2.0
    };

    // Calculate score for each function
    const functionScores = {};
    allFunctions.forEach(func => {
        const funcData = data.filter(d => d.Function === func);
        let score = 0;
        funcData.forEach(d => {
            const weight = responseWeights[d.Response] || 0;
            score += d.percentage * weight;
        });
        functionScores[func] = score;
    });

    // Sort functions: Overall first, then by positivity score (most positive first)
    const functions = allFunctions.sort((a, b) => {
        if (a === "Overall") return -1;
        if (b === "Overall") return 1;
        return functionScores[b] - functionScores[a]; // Descending order (most positive first)
    });

    // Color scale: green (increase) to red (decrease)
    const colorScale = d3.scaleOrdinal()
        .domain(responses)
        .range([
            "#2d5016",      // Dark green - Increase by >20%
            "#4a7c2a",      // Medium green - Increase by 11–20%
            "#6ba84f",      // Light green - Increase by 3–10%
            "#d3d3d3",      // Gray - Little or no change
            "#f0f0f0",      // Light gray - Don't know
            "#f4a582",      // Light red - Decrease by 3–10%
            "#d6604d",      // Medium red - Decrease by 11–20%
            "#b2182b"       // Dark red - Decrease by >20%
        ]);

    // Prepare data for stacking
    const functionData = functions.map(function(func) {
        const funcData = data.filter(d => d.Function === func);
        const responseMap = {};
        responses.forEach(resp => {
            const match = funcData.find(d => d.Response === resp);
            responseMap[resp] = match ? match.percentage : 0;
        });
        return {
            function: func,
            ...responseMap
        };
    });

    // Set up dimensions
    const margin = { top: 40, right: 40, bottom: 150, left: 200 };
    const baseWidth = 900;
    const width = baseWidth - margin.left - margin.right;
    const height = Math.max(400, functions.length * 40) - margin.top - margin.bottom;
    const svgWidth = baseWidth;
    const svgHeight = height + margin.top + margin.bottom;

    // Create SVG
    const svg = d3.select("#industry-outlook")
        .append("svg")
        .attr("width", "100%")
        .attr("height", svgHeight)
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "#2c3e50")
        .style("color", "#F0EEE6")
        .style("padding", "4px 8px")
        .style("border-radius", "3px")
        .style("font-size", "10px")
        .style("font-family", "'Merriweather', serif")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    // Create stack generator
    const stack = d3.stack()
        .keys(responses)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetExpand);

    const stackedData = stack(functionData);

    // X scale (percentage)
    const xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);

    // Y scale (functions)
    const yScale = d3.scaleBand()
        .domain(functions)
        .range([0, height])
        .padding(0.2);

    // Create bars
    const bars = g.selectAll(".function-group")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "function-group")
        .selectAll(".bar")
        .data(function(layer) {
            return layer.map(function(point) {
                // Preserve the array structure [y0, y1] and add the key
                const result = [point[0], point[1]];
                result.data = point.data;
                result.key = layer.key;
                return result;
            });
        })
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d.data.function))
        .attr("width", d => xScale(d[1]) - xScale(d[0]))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.key))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(d.key);
        })
        .on("mousemove", function(event) {
            // Update tooltip position to follow cursor
            tooltip
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 30) + "px") // Position above cursor
                .style("transform", "translateX(-50%)"); // Center horizontally on cursor
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add function labels on the left
    g.append("g")
        .selectAll(".function-label")
        .data(functions)
        .enter()
        .append("text")
        .attr("class", "function-label")
        .attr("x", -10)
        .attr("y", d => yScale(d) + yScale.bandwidth() / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "11px")
        .attr("font-family", "'Merriweather', serif")
        .attr("fill", "#2c3e50")
        .attr("font-weight", d => d === "Overall" ? "bold" : "normal")
        .text(d => d);

    // Add x-axis (percentage)
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format(".0%"))
        .ticks(5);

    const xAxisGroup = g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    xAxisGroup.selectAll("text")
        .attr("font-size", "11px")
        .attr("font-family", "'Merriweather', serif")
        .attr("fill", "#2c3e50");

    xAxisGroup.selectAll("line")
        .attr("stroke", "#ccc");

    // Add title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-family", "'Merriweather', serif")
        .attr("font-weight", "600")
        .attr("fill", "#2c3e50")
        .text("Expected Change in Workforce Size by Function");

    // Add legend - split into two rows
    const legendRow1 = [
        "Increase by >20%",
        "Increase by 11–20%",
        "Increase by 3–10%",
        "Little or no change"
    ];
    
    const legendRow2 = [
        "Decrease by 3–10%",
        "Decrease by 11–20%",
        "Decrease by >20%",
        "Don't know"
    ];

    // Legend spacing and positioning
    const legendItemSpacing = 140; // Increased spacing between items
    const legendItemWidth = 130; // Approximate width per item (square + text)
    const totalLegendWidth1 = (legendRow1.length - 1) * legendItemSpacing + legendItemWidth;
    const totalLegendWidth2 = (legendRow2.length - 1) * legendItemSpacing + legendItemWidth;
    // Center under the bar chart area (from margin.left to margin.left + width)
    const chartCenterX = margin.left + width / 2;
    const legendStartX1 = chartCenterX - totalLegendWidth1 / 2;
    const legendStartX2 = chartCenterX - totalLegendWidth2 / 2;

    // First row
    const legend1 = svg.append("g")
        .attr("class", "legend-row-1")
        .attr("transform", `translate(${legendStartX1},${height + margin.top + 35})`);

    const legendItems1 = legend1.selectAll(".legend-item")
        .data(legendRow1)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${i * legendItemSpacing}, 0)`);

    legendItems1.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => colorScale(d));

    legendItems1.append("text")
        .attr("x", 18)
        .attr("y", 9)
        .attr("font-size", "10px")
        .attr("font-family", "'Merriweather', serif")
        .attr("fill", "#2c3e50")
        .text(d => d);

    // Second row
    const legend2 = svg.append("g")
        .attr("class", "legend-row-2")
        .attr("transform", `translate(${legendStartX2},${height + margin.top + 55})`);

    const legendItems2 = legend2.selectAll(".legend-item")
        .data(legendRow2)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${i * legendItemSpacing}, 0)`);

    legendItems2.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => colorScale(d));

    legendItems2.append("text")
        .attr("x", 18)
        .attr("y", 9)
        .attr("font-size", "10px")
        .attr("font-family", "'Merriweather', serif")
        .attr("fill", "#2c3e50")
        .text(d => d);

}).catch(function(error) {
    console.error("Error loading CSV:", error);
});

