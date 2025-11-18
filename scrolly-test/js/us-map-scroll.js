// US Map Visualization - Scroll-Driven Version
let usMapViz = null;
let usMapData = null;
const usMapTheme = window.aiVizTheme || {};
const usTextPrimary = usMapTheme.palette?.textPrimary || "#f6f7ff";
const usTextMuted = usMapTheme.palette?.textMuted || "#9da7c2";
const usSurface = usMapTheme.palette?.surface || "#0e111f";
const usBorder = usMapTheme.palette?.border || "rgba(255,255,255,0.08)";

async function createUSMap() {
    // Clear existing visualization
    d3.select("#us-map").selectAll("*").remove();

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("border-radius", "8px")
        .style("font-size", "11px")
        .style("font-family", "'Merriweather', serif")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    if (usMapTheme.styleTooltip) {
        usMapTheme.styleTooltip(tooltip);
    }

    try {
        // Load data
        if (!usMapData) {
            usMapData = await d3.csv("data/Data/fig_4.2.10.csv");
        }

        const width = 1200, height = 700;
        const margin = { top: 60, right: 20, bottom: 40, left: 20 };

        const svg = d3.select("#us-map")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "600")
            .attr("fill", usTextPrimary)
            .text("US AI Job Posting Distribution by State (2024)");

        const projection = d3.geoAlbersUsa()
            .translate([width / 2, height / 2])
            .scale(1300);
        const path = d3.geoPath().projection(projection);

        const stateNameToCode = {
            "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
            "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
            "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
            "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
            "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
            "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
            "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
            "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
            "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
            "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
            "District of Columbia": "DC"
        };

        const dataByState = new Map();
        usMapData.forEach(row => {
            const stateCode = row["State code"]?.trim();
            const percent = parseFloat(row["Percentage of US AI job postings"]?.replace("%", ""));
            if (stateCode && !isNaN(percent)) {
                dataByState.set(stateCode, percent);
            }
        });

        const us = await d3.json("../topojson/states-10m.json");
        const states = topojson.feature(us, us.objects.states).features;

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRgb(
                usMapTheme.palette?.accentSecondary || "#6be2ff",
                usMapTheme.palette?.accent || "#1fb8ff"
            ))
            .domain([0, d3.max(Array.from(dataByState.values()))]);

        svg.selectAll("path")
            .data(states)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => {
                const stateName = d.properties.name;
                const stateCode = stateNameToCode[stateName];
                const value = dataByState.get(stateCode);
                return value ? colorScale(value) : usSurface;
            })
            .attr("stroke", usBorder)
            .attr("stroke-width", 0.7)
            .on("mouseover", function (event, d) {
                const stateName = d.properties.name;
                const stateCode = stateNameToCode[stateName];
                const value = dataByState.get(stateCode);

                if (value) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);
                    tooltip.html(
                        `${stateName}<br/>` +
                        `${value}% of US AI job postings`
                    );
                }
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 30) + "px")
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        const legendWidth = 300;
        const legendHeight = 10;
        const legendX = width - legendWidth - 50;
        const legendY = height - 60;

        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => d.toFixed(1) + "%");

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.1, 0.1))
            .enter()
            .append("stop")
            .attr("offset", d => (d * 100) + "%")
            .attr("stop-color", d => colorScale(d * colorScale.domain()[1]));

        const legend = svg.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        legend.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .selectAll("text")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-size", "10px")
            .attr("fill", usTextMuted);

        legend.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-size", "12px")
            .attr("fill", usTextPrimary)
            .text("% of US AI Job Postings");

        usMapViz = { svg, projection, path, states, dataByState };
    } catch (error) {
        console.error("Error loading US map:", error);
    }
}

// Initialize on load
$(document).ready(function() {
    setTimeout(createUSMap, 500);
});

