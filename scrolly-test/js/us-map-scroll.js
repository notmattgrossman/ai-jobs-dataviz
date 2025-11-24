let usMapViz = null;
let usMapData = null;
let usMapRawCounts = null;
let usMapIntensity = null;
let usMapTitle = null;
let usMapSubtitle = null;
let usCurrentMetric = 0; // 0 = share of US jobs, 1 = AI intensity
const usMapTheme = window.aiVizTheme || {};
const usTextPrimary = usMapTheme.palette?.textPrimary || "#f6f7ff";
const usTextMuted = usMapTheme.palette?.textMuted || "#9da7c2";
const usSurface = usMapTheme.palette?.surface || "#0e111f";
const usBorder = usMapTheme.palette?.border || "rgba(255,255,255,0.08)";

async function createUSMap() {
    d3.select("#us-map").selectAll("*").remove();

    const tooltip = d3.select("body")
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

    if (usMapTheme.styleTooltip) {
        usMapTheme.styleTooltip(tooltip);
    }

    try {
        // Load all three datasets
        if (!usMapData) {
            usMapData = await d3.csv("data/Data/fig_4.2.10.csv"); // Share of US AI jobs
        }
        if (!usMapRawCounts) {
            usMapRawCounts = await d3.csv("data/Data/fig_4.2.8.csv"); // Raw counts
        }
        if (!usMapIntensity) {
            usMapIntensity = await d3.csv("data/Data/fig_4.2.9.csv"); // AI intensity
        }

        const width = 1200, height = 700;
        const margin = { top: 60, right: 20, bottom: 40, left: 20 };

        const svg = d3.select("#us-map")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Add background rectangle for titles
        const titleBgHeight = 80;
        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", titleBgHeight)
            .attr("fill", "#0a0b14");

        usMapTitle = svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", usTextPrimary)
            .text("US AI Job Posting Distribution by State (2024)");

        // Subtitle explaining how values are calculated
        usMapSubtitle = svg.append("text")
            .attr("x", width / 2)
            .attr("y", 55)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", usTextMuted)
            .text("Color shows each state's share of US AI job postings (%), using 2024 values.");

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

        // Build data maps for all metrics
        const dataByState = new Map();
        const rawCountsByState = new Map();
        const intensityByState = new Map();

        usMapData.forEach(row => {
            const stateCode = row["State code"]?.trim();
            const percent = parseFloat(row["Percentage of US AI job postings"]?.replace("%", ""));
            if (stateCode && !isNaN(percent)) {
                dataByState.set(stateCode, percent);
            }
        });

        usMapRawCounts.forEach(row => {
            const stateCode = row["State code"]?.trim();
            const count = parseInt(row["Numbe rof AI job postings"]); // Note: typo in CSV header
            if (stateCode && !isNaN(count)) {
                rawCountsByState.set(stateCode, count);
            }
        });

        usMapIntensity.forEach(row => {
            const stateCode = row["State code"]?.trim();
            const percent = parseFloat(row["Percentage of US states' job postings in AI"]?.replace("%", ""));
            if (stateCode && !isNaN(percent)) {
                intensityByState.set(stateCode, percent);
            }
        });

        const us = await d3.json("../topojson/states-10m.json");
        const states = topojson.feature(us, us.objects.states).features;

        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(Array.from(dataByState.values()))])
            .interpolator(d3.interpolateRgb(
                usMapTheme.palette?.divergingPositive || usMapTheme.palette?.accentSecondary || "#43cbff",
                usMapTheme.palette?.divergingNegative || usMapTheme.palette?.negative || "#ff5c8d"
            ));

        svg.selectAll("path.state-fill")
            .data(states)
            .enter()
            .append("path")
            .attr("class", "state-fill")
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
                const rawCount = rawCountsByState.get(stateCode);
                const intensity = intensityByState.get(stateCode);

                if (value && rawCount) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);

                    let tooltipContent = `<strong>${stateName}</strong><br/>`;
                    tooltipContent += `${rawCount.toLocaleString()} AI job postings<br/>`;

                    if (usCurrentMetric === 0) {
                        tooltipContent += `${value}% of US AI job postings`;
                    } else {
                        tooltipContent += `${intensity}% of state's jobs are AI-related`;
                    }

                    tooltip.html(tooltipContent);
                }
            })
            .on("mousemove", function (event, d) {
                tooltip
                    .style("left", (event.clientX) + "px")
                    .style("top", (event.clientY - 80) + "px")
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        svg.selectAll("path.state-outline")
            .data(states)
            .enter()
            .append("path")
            .attr("class", "state-outline")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", usTextPrimary)
            .attr("stroke-width", 1.6);

        const legendWidth = 24;
        const legendHeight = 400;
        const legendX = width - legendWidth - 60;
        const legendY = height - legendHeight - 40;

        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([legendHeight, 0]);

        const legendAxis = d3.axisLeft(legendScale)
            .ticks(5)
            .tickFormat(d => d.toFixed(1) + "%");

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient-vertical")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

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
            .style("fill", "url(#legend-gradient-vertical)");

        legend.append("g")
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "16px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-size", "10px")
            .attr("fill", usTextMuted);

        // Add initial legend label for first metric
        legend.append("text")
            .attr("class", "legend-label")
            .attr("x", 12)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-size", "12px")
            .attr("font-weight", "300")
            .attr("fill", usTextPrimary)
            .text("% of US AI Jobs");

        usMapViz = {
            svg,
            projection,
            path,
            states,
            dataByState,
            rawCountsByState,
            intensityByState,
            colorScale,
            stateNameToCode,
            tooltip,
            legend,
            legendAxis,
            legendScale
        };
    } catch (error) {
        console.error("Error loading US map:", error);
    }
}

function updateUSMapMetric(metricIndex) {
    if (!usMapViz || usCurrentMetric === metricIndex) return;

    usCurrentMetric = metricIndex;
    const { svg, states, dataByState, intensityByState, colorScale, stateNameToCode, legendAxis, legendScale, legend } = usMapViz;

    // Choose data and labels based on metric
    let currentData, titleText, subtitleText, legendLabel;

    if (metricIndex === 0) {
        currentData = dataByState;
        titleText = "US AI Job Posting Distribution by State (2024)";
        subtitleText = "Color shows each state's share of US AI job postings (%), using 2024 values.";
        legendLabel = "% of US AI Job Postings";
    } else {
        currentData = intensityByState;
        titleText = "AI Job Intensity by State (2024)";
        subtitleText = "Color shows % of each state's job postings that are AI-related.";
        legendLabel = "% AI Job Intensity";
    }

    // Update color scale domain
    colorScale.domain([0, d3.max(Array.from(currentData.values()))]);

    // Update titles with fade
    usMapTitle.transition()
        .duration(300)
        .style("opacity", 0)
        .transition()
        .duration(0)
        .text(titleText)
        .transition()
        .duration(300)
        .style("opacity", 1);

    usMapSubtitle.transition()
        .duration(300)
        .style("opacity", 0)
        .transition()
        .duration(0)
        .text(subtitleText)
        .transition()
        .duration(300)
        .style("opacity", 1);

    // Update state fills
    svg.selectAll("path.state-fill")
        .transition()
        .duration(800)
        .attr("fill", d => {
            const stateName = d.properties.name;
            const stateCode = stateNameToCode[stateName];
            const value = currentData.get(stateCode);
            return value ? colorScale(value) : usMapViz.svg.select("rect").attr("fill");
        });

    // Update legend
    legendScale.domain(colorScale.domain());

    const newLegendAxis = d3.axisLeft(legendScale)
        .ticks(5)
        .tickFormat(d => d.toFixed(1) + "%");

    legend.select("g")
        .transition()
        .duration(800)
        .call(newLegendAxis)
        .selectAll("text")
        .style("font-size", "10px")
        .attr("font-family", "'Stack Sans Notch', serif")
        .attr("fill", usTextMuted);

    // Update legend gradient
    const linearGradient = svg.select("#legend-gradient-vertical");
    linearGradient.selectAll("stop")
        .transition()
        .duration(800)
        .attr("stop-color", d => colorScale(d * colorScale.domain()[1]));

    // Update legend label - swap between the two metrics
    const legendLabelText = metricIndex === 0 ? "% of US AI Jobs" : "% of State's Jobs";

    legend.select("text.legend-label")
        .transition()
        .duration(600)
        .style("opacity", 0)
        .transition()
        .duration(0)
        .text(legendLabelText)
        .transition()
        .duration(600)
        .style("opacity", 1);
}

function setupUSMapScrollObserver() {
    const section = document.getElementById('section-7');
    if (!section) {
        console.error('Section-7 not found');
        return;
    }

    let ticking = false;

    function updateOnScroll() {
        const sectionRect = section.getBoundingClientRect();
        const sectionTop = sectionRect.top;
        const sectionHeight = sectionRect.height;
        const viewportHeight = window.innerHeight;

        if (sectionTop <= 0 && sectionTop + sectionHeight > 0) {
            const scrollProgress = Math.max(0, Math.min(1,
                Math.abs(sectionTop) / (sectionHeight - viewportHeight)
            ));

            // Transition at 50% scroll through the section
            const targetMetric = scrollProgress < 0.5 ? 0 : 1;

            if (targetMetric !== usCurrentMetric) {
                console.log(`Updating US map to metric: ${targetMetric} (progress: ${scrollProgress.toFixed(2)})`);
                updateUSMapMetric(targetMetric);
            }
        } else if (sectionTop > 0) {
            if (usCurrentMetric !== 0) {
                updateUSMapMetric(0);
            }
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    });

    updateOnScroll();
}

$(document).ready(function () {
    setTimeout(() => {
        createUSMap().then(() => {
            setupUSMapScrollObserver();
        });
    }, 500);
});

