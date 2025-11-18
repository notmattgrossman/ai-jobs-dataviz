// Bubble to Scatter Morph Visualization - Scroll-Driven Version
let bubbleScatterViz = null;
let bubbleData = null;
let scatterData = null;
let bubbleCircles = null;
let scatterCircles = null;
let bubbleLabels = null;
let xScale = null;
let yScale = null;
let radiusScale = null;
let margin = null;
let width = null;
let height = null;
let svg = null;
let g = null;
const bubbleScatterTheme = window.aiVizTheme || {};
const bubbleTextPrimary = bubbleScatterTheme.palette?.textPrimary || "#f6f7ff";
const bubbleTextMuted = bubbleScatterTheme.palette?.textMuted || "#9da7c2";
const bubbleGridColor = bubbleScatterTheme.gridline || "rgba(255,255,255,0.12)";

function createBubbleScatterViz() {
    // Clear existing visualization
    d3.select("#bubble-scatter-viz").selectAll("*").remove();

    d3.csv("data/Data/fig_4.2.25.csv").then(function(data) {
        // Parse data
        data.forEach(function(d) {
            d.riskScore = parseFloat(d.pct_occ_scaled);
            d.salary = parseFloat(d.MedianSalary);
        });

        // Filter valid data
        const validData = data.filter(d => !isNaN(d.riskScore) && !isNaN(d.salary));
        
        // Sort by risk score and take top 50
        bubbleData = validData.sort((a, b) => b.riskScore - a.riskScore).slice(0, 50);
        scatterData = [...bubbleData]; // Same data for scatter

        // Set up dimensions
        margin = { top: 100, right: 40, bottom: 100, left: 80 };
        width = 900 - margin.left - margin.right;
        height = 700 - margin.top - margin.bottom;

        // Create SVG
        svg = d3.select("#bubble-scatter-viz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales for scatter plot
        xScale = d3.scaleLinear()
            .domain(d3.extent(bubbleData, d => d.riskScore))
            .range([0, width])
            .nice();

        yScale = d3.scaleLinear()
            .domain(d3.extent(bubbleData, d => d.salary))
            .range([height, 0])
            .nice();

        // Radius scale for bubbles
        const maxRisk = d3.max(bubbleData, d => d.riskScore);
        const minRisk = d3.min(bubbleData, d => d.riskScore);
        radiusScale = d3.scaleSqrt()
            .domain([minRisk, maxRisk])
            .range([5, 90]);

        const colorInterpolator = d3.scaleLinear()
            .domain([minRisk, maxRisk])
            .range([
                bubbleScatterTheme.palette?.divergingPositive || bubbleScatterTheme.palette?.accentSecondary || "#43cbff",
                bubbleScatterTheme.palette?.divergingNegative || bubbleScatterTheme.palette?.negative || "#ff5c8d"
            ])
            .interpolate(d3.interpolateRgb);

        // Store initial bubble positions (will be set by force simulation)
        // Store final scatter positions
        bubbleData.forEach(function(d, i) {
            d.bubbleRadius = radiusScale(d.riskScore);
            d.scatterX = xScale(d.riskScore);
            d.scatterY = yScale(d.salary);
            d.scatterRadius = 4;
            d.opacity = 0; // Start invisible
            d.bubbleX = width / 2; // Initial center position
            d.bubbleY = height / 2; // Initial center position
            d.index = i; // Store index for reference
        });

        // Create force simulation for bubbles
        const simulation = d3.forceSimulation(bubbleData)
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05))
            .force("collision", d3.forceCollide().radius(d => d.bubbleRadius + 2))
            .force("charge", d3.forceManyBody().strength(-50))
            .alphaDecay(0.02) // Slower decay for smoother settling
            .on("tick", function() {
                if (bubbleCircles) {
                    bubbleCircles
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y);
                }
                
                // Update labels for top 5 only
                if (bubbleLabels) {
                    bubbleLabels
                        .attr("x", d => {
                            const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                            return dataPoint ? dataPoint.x : d.bubbleX;
                        })
                        .attr("y", d => {
                            const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                            return dataPoint ? dataPoint.y : d.bubbleY;
                        });
                }
            });

        // Create circles (will be used for both bubbles and scatter)
        bubbleCircles = g.selectAll(".bubble-circle")
            .data(bubbleData)
            .enter()
            .append("circle")
            .attr("class", "bubble-circle")
            .attr("cx", d => d.bubbleX)
            .attr("cy", d => d.bubbleY)
            .attr("r", d => d.bubbleRadius)
            .attr("fill", d => colorInterpolator(d.riskScore))
            .attr("stroke", "rgba(5,6,13,0.45)")
            .attr("stroke-width", 1)
            .attr("opacity", 0);

        // Store bubble positions after simulation settles
        let simulationComplete = false;
        simulation.on("end", function() {
            if (!simulationComplete) {
                bubbleData.forEach(function(d) {
                    d.bubbleX = d.x || width / 2;
                    d.bubbleY = d.y || height / 2;
                });
                simulationComplete = true;
                // Update circles to final bubble positions
                if (bubbleCircles) {
                    bubbleCircles
                        .attr("cx", d => d.bubbleX)
                        .attr("cy", d => d.bubbleY);
                }
                // Update labels
                if (bubbleLabels) {
                    bubbleLabels
                        .attr("x", d => {
                            const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                            return dataPoint ? dataPoint.bubbleX : d.bubbleX;
                        })
                        .attr("y", d => {
                            const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                            return dataPoint ? dataPoint.bubbleY : d.bubbleY;
                        });
                }
            }
        });
        
        // Stop simulation after it settles (to save performance)
        setTimeout(() => {
            simulation.stop();
        }, 2000);

        // Add labels for top 5 (only visible in bubble mode)
        const top5Data = bubbleData.slice(0, 5);
        bubbleLabels = g.selectAll(".bubble-label")
            .data(top5Data)
            .enter()
            .append("text")
            .attr("class", "bubble-label")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Merriweather', serif")
            .attr("fill", bubbleTextPrimary)
            .attr("font-weight", "700")
            .text(d => d.Title)
            .style("pointer-events", "none")
            .attr("opacity", 0)
            .attr("x", d => d.bubbleX)
            .attr("y", d => d.bubbleY);

        // Add grid lines (for scatter plot)
        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(8)
                .tickSize(-height)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", bubbleGridColor)
            .attr("stroke-width", 1)
            .attr("opacity", 0);

        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .ticks(8)
                .tickSize(-width)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", bubbleGridColor)
            .attr("stroke-width", 1)
            .attr("opacity", 0);

        // Add axes (for scatter plot)
        const xAxis = d3.axisBottom(xScale).ticks(8);
        const yAxis = d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => "$" + (d / 1000) + "K");

        const xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .attr("opacity", 0);

        xAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Merriweather', serif")
            .attr("fill", bubbleTextMuted);

        const yAxisGroup = g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .attr("opacity", 0);

        yAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Merriweather', serif")
            .attr("fill", bubbleTextMuted);

        yAxisGroup.select(".domain")
            .attr("stroke", "none");

        xAxisGroup.selectAll("line, path")
            .attr("stroke", bubbleGridColor);

        yAxisGroup.selectAll("line, path")
            .attr("stroke", bubbleGridColor);

        // Add axis labels
        const xAxisLabel = svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2 + margin.left)
            .attr("y", margin.top + height + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Merriweather', serif")
            .attr("fill", bubbleTextPrimary)
            .attr("opacity", 0);
        
        xAxisLabel.append("tspan")
            .attr("font-weight", "600")
            .text("Risk Score");
        
        xAxisLabel.append("tspan")
            .attr("font-weight", "400")
            .attr("font-style", "italic")
            .attr("fill", bubbleTextMuted)
            .text(" (Higher risk score means more vulnerable)");

        const yAxisLabel = svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "600")
            .attr("fill", bubbleTextPrimary)
            .attr("opacity", 0)
            .text("Median Salary");

        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "600")
            .attr("fill", bubbleTextPrimary)
            .text("Job Vulnerability and Salary");

        bubbleScatterViz = {
            svg, g, xScale, yScale, radiusScale,
            bubbleCircles, bubbleLabels, bubbleData,
            margin, width, height, simulation
        };
        
        console.log('Bubble scatter viz initialized');
    }).catch(function(error) {
        console.error("Error loading CSV:", error);
    });
}

function updateBubbleScatter(scrollPercent) {
    if (!bubbleScatterViz || !bubbleScatterViz.bubbleCircles) {
        return;
    }

    const { bubbleCircles, bubbleLabels, bubbleData, svg, g, width, height } = bubbleScatterViz;
    
    if (scrollPercent <= 0.5) {
        // Phase 1: Bubbles appear progressively (0-50%)
        const appearanceProgress = scrollPercent / 0.5; // 0 to 1
        
        // Update opacity and positions together
        bubbleCircles.each(function(d) {
            const threshold = d.index / bubbleData.length;
            const shouldShow = appearanceProgress >= threshold;
            const bubbleX = d.bubbleX || width / 2;
            const bubbleY = d.bubbleY || height / 2;
            
            d3.select(this)
                .interrupt()
                .transition()
                .duration(300)
                .ease(d3.easeCubicOut)
                .attr("opacity", shouldShow ? 1 : 0)
                .attr("cx", bubbleX)
                .attr("cy", bubbleY)
                .attr("r", d.bubbleRadius);
        });

        // Show labels for top 5
        if (bubbleLabels) {
            bubbleLabels
                .transition()
                .duration(50)
                .ease(d3.easeLinear)
                .attr("opacity", appearanceProgress > 0.3 ? 1 : 0)
                .attr("x", d => {
                    const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                    return dataPoint ? (dataPoint.bubbleX || width / 2) : (d.bubbleX || width / 2);
                })
                .attr("y", d => {
                    const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                    return dataPoint ? (dataPoint.bubbleY || height / 2) : (d.bubbleY || height / 2);
                });
        }

        // Hide scatter elements
        svg.selectAll(".grid").attr("opacity", 0);
        svg.selectAll(".x-axis").attr("opacity", 0);
        svg.selectAll(".y-axis").attr("opacity", 0);
        svg.selectAll(".axis-label").attr("opacity", 0);

    } else {
        // Phase 2: Morph to scatter plot (50-100%)
        const morphProgress = (scrollPercent - 0.5) / 0.5; // 0 to 1
        
        // Interpolate between bubble and scatter positions
        bubbleCircles.each(function(d) {
            const bubbleX = d.bubbleX || width / 2;
            const bubbleY = d.bubbleY || height / 2;
            const currentX = bubbleX + (d.scatterX - bubbleX) * morphProgress;
            const currentY = bubbleY + (d.scatterY - bubbleY) * morphProgress;
            const currentR = d.bubbleRadius + (d.scatterRadius - d.bubbleRadius) * morphProgress;
            
            d3.select(this)
                .interrupt()
                .transition()
                .duration(300)
                .ease(d3.easeCubicInOut)
                .attr("opacity", 1)
                .attr("cx", currentX)
                .attr("cy", currentY)
                .attr("r", currentR);
        });

        // Fade out labels
        if (bubbleLabels) {
            bubbleLabels
                .transition()
                .duration(50)
                .ease(d3.easeCubicInOut)
                .attr("opacity", 1 - morphProgress)
                .attr("x", d => {
                    const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                    if (!dataPoint) return d.bubbleX || width / 2;
                    const bubbleX = dataPoint.bubbleX || width / 2;
                    return bubbleX + (dataPoint.scatterX - bubbleX) * morphProgress;
                })
                .attr("y", d => {
                    const dataPoint = bubbleData.find(bd => bd.Title === d.Title);
                    if (!dataPoint) return d.bubbleY || height / 2;
                    const bubbleY = dataPoint.bubbleY || height / 2;
                    return bubbleY + (dataPoint.scatterY - bubbleY) * morphProgress;
                });
        }

        // Fade in scatter elements
        svg.selectAll(".grid")
            .transition()
            .duration(50)
            .ease(d3.easeCubicInOut)
            .attr("opacity", morphProgress);
        
        svg.selectAll(".x-axis")
            .transition()
            .duration(50)
            .ease(d3.easeCubicInOut)
            .attr("opacity", morphProgress);
        
        svg.selectAll(".y-axis")
            .transition()
            .duration(50)
            .ease(d3.easeCubicInOut)
            .attr("opacity", morphProgress);
        
        svg.selectAll(".axis-label")
            .transition()
            .duration(50)
            .ease(d3.easeCubicInOut)
            .attr("opacity", morphProgress);
    }
}

// Initialize on load
createBubbleScatterViz();

