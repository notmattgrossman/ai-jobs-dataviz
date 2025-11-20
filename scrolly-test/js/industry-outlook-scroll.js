// Industry Outlook Horizontal Stacked Bar Chart - Scroll-Driven Version
const industryTheme = window.aiVizTheme || {};
const industryTextPrimary = industryTheme.palette?.textPrimary || "#f6f7ff";
const industryTextMuted = industryTheme.palette?.textMuted || "#9da7c2";
const industryGridColor = industryTheme.gridline || "rgba(255,255,255,0.12)";
const industryStackColors = (industryTheme.stackPalette && industryTheme.stackPalette.length >= 8)
    ? industryTheme.stackPalette.slice(0, 8)
    : [
        "#a6f0ff",
        "#43cbff",
        "#0f99ff",
        "#94a3b8",
        "#4c5672",
        "#ff93b6",
        "#ff5c8d",
        "#e02f72"
    ];
let industryOutlookViz = null;

function createIndustryOutlook(filterState = 'all') {
    // Clear existing visualization
    d3.select("#industry-outlook").selectAll("*").remove();

    // Use cached data if available, otherwise load
    const dataPromise = industryData ? Promise.resolve(industryData) : d3.csv("data/Data/fig_4.4.12.csv");
    
    dataPromise.then(function(data) {
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

        // Filter functions based on state
        let functions;
        if (filterState === 'overall') {
            functions = ["Overall"];
        } else if (filterState === 'it') {
            functions = ["IT"];
        } else {
            // Calculate positivity score for sorting
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

            functions = allFunctions.sort((a, b) => {
                if (a === "Overall") return -1;
                if (b === "Overall") return 1;
                return functionScores[b] - functionScores[a];
            });
        }

        const colorScale = d3.scaleOrdinal()
            .domain(responses)
            .range(industryStackColors);

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

        // Create tooltip (reuse if exists, otherwise create new)
        let tooltip = d3.select("body").select(".tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "fixed")
                .style("padding", "6px 10px")
                .style("border-radius", "8px")
                .style("font-size", "11px")
                .style("font-family", "'Stack Sans Notch', serif")
                .style("pointer-events", "none")
                .style("z-index", "1000");

            if (industryTheme.styleTooltip) {
                industryTheme.styleTooltip(tooltip);
            }
        }

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

        // Create bars with transition
        const bars = g.selectAll(".function-group")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("class", "function-group")
            .selectAll(".bar")
            .data(function(layer) {
                return layer.map(function(point) {
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
            .attr("stroke", "rgba(5,6,13,0.45)")
            .attr("stroke-width", 0.6)
            .on("mouseover", function(event, d) {
                const percentage = (d[1] - d[0]) * 100;
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`${d.data.function}<br/>${d.key}<br/>${percentage.toFixed(1)}%`);
                
                d3.select(this)
                    .attr("stroke-width", 2)
                    .attr("stroke", industryTextPrimary)
                    .attr("opacity", 0.9);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.clientX) + "px")
                    .style("top", (event.clientY - 80) + "px")
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                d3.select(this)
                    .attr("stroke-width", 0.6)
                    .attr("stroke", "rgba(5,6,13,0.45)")
                    .attr("opacity", 1);
            });

        // Add function labels
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
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("fill", d => d === "Overall" ? industryTextPrimary : industryTextMuted)
            .attr("font-weight", "300")
            .text(d => d);

        // Add x-axis
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format(".0%"))
            .ticks(5);

        const xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        xAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", industryTextMuted);

        xAxisGroup.selectAll("line")
            .attr("stroke", industryGridColor);

        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", industryTextPrimary)
            .text("Expected Change in Workforce Size by Function");

        // Add legend
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

        const legendItemSpacing = 140;
        const legendItemWidth = 130;
        const totalLegendWidth1 = (legendRow1.length - 1) * legendItemSpacing + legendItemWidth;
        const totalLegendWidth2 = (legendRow2.length - 1) * legendItemSpacing + legendItemWidth;
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
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", industryTextMuted)
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
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", industryTextMuted)
            .text(d => d);

        industryOutlookViz = { svg, g, xScale, yScale, functions, data, responses, colorScale };
    }).catch(function(error) {
        console.error("Error loading CSV:", error);
    });
}

let currentFilterState = null;
let industryData = null;
let industryVizReady = false;

function updateIndustryOutlook(filterState) {
    // Only recreate if filter state changed
    if (filterState !== currentFilterState && industryVizReady) {
        currentFilterState = filterState;
        createIndustryOutlook(filterState);
    }
}

// Initialize on load - wait for data
d3.csv("data/Data/fig_4.4.12.csv").then(function(data) {
    industryData = data;
    industryVizReady = true;
    createIndustryOutlook('all');
}).catch(function(error) {
    console.error("Error loading industry data:", error);
});

