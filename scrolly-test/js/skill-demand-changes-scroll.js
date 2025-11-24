// AI Skill Demand Changes - Multiple Lines Chart (2017-2025) - Scroll-Driven Version
const skillTheme = window.aiVizTheme || {};
const skillTextPrimary = skillTheme.palette?.textPrimary || "#f6f7ff";
const skillTextMuted = skillTheme.palette?.textMuted || "#9da7c2";
const skillGridColor = skillTheme.gridline || "rgba(255,255,255,0.12)";
let skillDemandChangesViz = null;
let skillDemandData = null;

function createSkillDemandChanges() {
    // Clear existing visualization
    d3.select("#skill-demand-changes").selectAll("*").remove();

    const dataPromise = skillDemandData ? Promise.resolve(skillDemandData) : d3.csv("data/Data/fig_4.2.3.csv");
    
    dataPromise.then(function(data) {
        // Parse percentage values and year
        data.forEach(function(d) {
            d.percentage = parseFloat(d["AI job postings (% of all job postings)"].replace("%", ""));
            d.year = parseInt(d.Year);
            d.skill = d["Skill cluster"];
        });

        // Cache data
        if (!skillDemandData) {
            skillDemandData = data;
        }

        // Filter data for 2017-2024 (we'll project 2025)
        const filteredData = data.filter(d => d.year >= 2017 && d.year <= 2024);
        
        // Get unique skills
        const allSkills = [...new Set(filteredData.map(d => d.skill))];
        
        // Calculate demand index for each skill over time
        const maxPercentage = d3.max(filteredData, d => d.percentage);
        
        // Prepare data for each skill (time series 2017-2025)
        const skillTimeSeries = allSkills.map(skill => {
            const skillData = filteredData.filter(d => d.skill === skill).sort((a, b) => a.year - b.year);
            
            const timeSeries = [];
            for (let year = 2017; year <= 2024; year++) {
                const yearData = skillData.find(d => d.year === year);
                if (yearData) {
                    timeSeries.push({
                        year: year,
                        percentage: yearData.percentage,
                        demandIndex: (yearData.percentage / maxPercentage) * 100
                    });
                }
            }
            
            // Project 2025 based on recent trend
            if (timeSeries.length >= 3) {
                const value2022 = timeSeries.find(d => d.year === 2022);
                const value2023 = timeSeries.find(d => d.year === 2023);
                const value2024 = timeSeries.find(d => d.year === 2024);
                
                if (value2022 && value2023 && value2024) {
                    const growth2022_2023 = value2023.percentage - value2022.percentage;
                    const growth2023_2024 = value2024.percentage - value2023.percentage;
                    const avgGrowth = (growth2022_2023 + growth2023_2024) / 2;
                    
                    const projected2025 = Math.max(0, value2024.percentage + avgGrowth);
                    timeSeries.push({
                        year: 2025,
                        percentage: projected2025,
                        demandIndex: (projected2025 / maxPercentage) * 100,
                        isProjected: true
                    });
                }
            }
            
            const startValue = timeSeries[0] ? timeSeries[0].percentage : 0;
            const endValue = timeSeries[timeSeries.length - 1] ? timeSeries[timeSeries.length - 1].percentage : 0;
            const totalGrowth = endValue - startValue;
            
            return {
                skill: skill,
                timeSeries: timeSeries,
                totalGrowth: totalGrowth,
                endValue: endValue
            };
        }).filter(d => d.timeSeries.length > 0);

        // Sort by end value and take top 8 skills
        const topSkills = skillTimeSeries
            .sort((a, b) => b.endValue - a.endValue)
            .slice(0, 8);

        // Set up dimensions
        const margin = { top: 60, right: 200, bottom: 80, left: 80 };
        const baseWidth = 1000;
        const width = baseWidth - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        const svgWidth = baseWidth;
        const svgHeight = height + margin.top + margin.bottom;

        // Create SVG
        const svg = d3.select("#skill-demand-changes")
            .append("svg")
            .attr("width", "100%")
            .attr("height", svgHeight)
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create a separate group for data elements that will be clipped
        const dataGroup = g.append("g")
            .attr("class", "data-group");

        // Create tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "fixed")
            .style("padding", "8px 12px")
            .style("border-radius", "8px")
            .style("font-size", "11px")
            .style("font-family", "'Stack Sans Notch', serif")
            .style("pointer-events", "none")
            .style("z-index", "1000");

        if (skillTheme.styleTooltip) {
            skillTheme.styleTooltip(tooltip);
        }

        // Scales
        const xScale = d3.scaleLinear()
            .domain([2017, 2025])
            .range([0, width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0])
            .nice();

        // Color scale for different skills
        const palette = (skillTheme.categoricalPalette && skillTheme.categoricalPalette.length >= topSkills.length)
            ? skillTheme.categoricalPalette.slice(0, topSkills.length)
            : [
                "#8fe8ff",
                "#65d4ff",
                "#43bbff",
                "#1f9bff",
                "#0f7dd6",
                "#5ab8ff",
                "#3a9eff",
                "#1e7edb"
            ];

        const colorScale = d3.scaleOrdinal()
            .domain(topSkills.map(d => d.skill))
            .range(palette);

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.demandIndex))
            .curve(d3.curveMonotoneX);

        // Create lines for each skill (in data group for clipping)
        const lines = dataGroup.selectAll(".skill-line")
            .data(topSkills)
            .enter()
            .append("g")
            .attr("class", "skill-line");

        // Draw lines
        lines.append("path")
            .attr("d", d => line(d.timeSeries))
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.skill))
            .attr("stroke-width", 2.5)
            .attr("stroke-opacity", 0.8)
            .attr("stroke-linecap", "round")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 4)
                    .attr("stroke-opacity", 1);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
            })
            .on("mousemove", function(event, d) {
                const [x, y] = d3.pointer(event, g.node());
                const year = Math.round(xScale.invert(x));
                const point = d.timeSeries.find(v => v.year === year) || d.timeSeries[d.timeSeries.length - 1];
                
                const yearLabel = point.isProjected ? `${point.year} (Projected)` : point.year;
                tooltip.html(`${d.skill}<br/>${yearLabel}: ${point.demandIndex.toFixed(1)} index<br/>(${point.percentage.toFixed(2)}% of all jobs)`)
                    .style("left", (event.clientX) + "px")
                    .style("top", (event.clientY - 80) + "px")
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 2.5)
                    .attr("stroke-opacity", 0.8);
                
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add dots for key years
        const keyYears = [2017, 2020, 2024, 2025];
        topSkills.forEach(skillData => {
            keyYears.forEach(year => {
                const point = skillData.timeSeries.find(v => v.year === year);
                if (point) {
                    lines.append("circle")
                        .datum(point)
                        .attr("cx", xScale(point.year))
                        .attr("cy", yScale(point.demandIndex))
                        .attr("r", point.isProjected ? 3 : 4)
                        .attr("fill", colorScale(skillData.skill))
                        .attr("stroke", "rgba(5,6,13,0.45)")
                        .attr("stroke-width", 1.5)
                        .attr("opacity", point.isProjected ? 0.7 : 1)
                        .attr("stroke-dasharray", point.isProjected ? "2,2" : "0");
                }
            });
        });

        // Add vertical line at 2024 (in data group for clipping)
        dataGroup.append("line")
            .attr("x1", xScale(2024))
            .attr("x2", xScale(2024))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", skillGridColor)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5")
            .attr("opacity", 0.5);

        // Add x-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(9)
            .tickFormat(d3.format("d"));

        const xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        xAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextMuted);

        xAxisGroup.selectAll("line")
            .attr("stroke", skillGridColor);

        // Add x-axis label
        g.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextPrimary)
            .text("Year (2017-2025)");

        // Add y-axis
        const yAxis = d3.axisLeft(yScale)
            .ticks(6)
            .tickFormat(d => d.toFixed(0));

        const yAxisGroup = g.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        yAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextMuted);

        yAxisGroup.selectAll("line")
            .attr("stroke", skillGridColor);

        // Add y-axis label
        g.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextPrimary)
            .text("Demand Index (0-100)");

        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextPrimary)
            .text("AI Skill Demand Changes (2017-2025)");

        // Add subtitle
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextMuted)
            .text("Top 8 skills showing demand index trends over time (2025 projected)");

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + margin.left + 20}, ${margin.top + 20})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(topSkills)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`);

        legendItems.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", d => colorScale(d.skill))
            .attr("stroke-width", 2.5)
            .attr("stroke-opacity", 0.8);

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 4)
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", skillTextMuted)
            .text(d => d.skill);

        // Add note about projection
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", height + margin.top + 70)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-style", "italic")
            .attr("fill", skillTextMuted)
            .text("Dashed vertical line indicates transition from historical data (2017-2024) to projected data (2025)");

        // Create clipping mask for progressive reveal from y-axis
        const defs = svg.append("defs");
        const clipPath = defs.append("clipPath")
            .attr("id", "timeline-clip");
        
        // Create rectangle that starts at y-axis and grows to the right
        const revealRect = clipPath.append("rect")
            .attr("id", "reveal-rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0) // Start with width 0 (at y-axis)
            .attr("height", height); // Full height from start
        
        // Apply clipping only to the data group (not axes)
        dataGroup.attr("clip-path", "url(#timeline-clip)");
        
        // Create a vertical line indicator showing the current reveal position
        const revealLine = g.append("line")
            .attr("id", "reveal-line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", skillTextMuted)
            .attr("stroke-width", 2.5)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-dasharray", "4,4")
            .style("pointer-events", "none");

        skillDemandChangesViz = { 
            svg, 
            g, 
            xScale, 
            yScale, 
            lines, 
            revealRect, 
            revealLine,
            dataGroup,
            width,
            height,
            margin
        };
        
        // Initialize with lens at 0
        updateSkillDemandLens(0);
    }).catch(function(error) {
        console.error("Error loading CSV:", error);
    });
}

// Function to update timeline reveal based on scroll progress (0-100)
function updateSkillDemandLens(scrollPercent) {
    if (!skillDemandChangesViz) return;
    
    const { revealRect, revealLine, width, xScale } = skillDemandChangesViz;
    
    // Use easing for smoother reveal
    const easedProgress = d3.easeCubicOut(scrollPercent / 100);
    
    // Calculate current reveal width (from y-axis to current position)
    const currentWidth = width * easedProgress;
    
    // Calculate the current year being revealed
    const currentX = currentWidth;
    const currentYear = xScale.invert(currentX);
    
    // Update reveal rectangle (clipping path)
    revealRect
        .interrupt()
        .transition()
        .duration(50)
        .ease(d3.easeLinear)
        .attr("width", Math.max(0, currentWidth));
    
    // Update reveal line indicator
    revealLine
        .interrupt()
        .transition()
        .duration(50)
        .ease(d3.easeLinear)
        .attr("x1", currentX)
        .attr("x2", currentX)
        .attr("opacity", scrollPercent > 1 && scrollPercent < 99 ? 0.6 : 0);
}

// Initialize on load
$(document).ready(function() {
    setTimeout(createSkillDemandChanges, 500);
});

