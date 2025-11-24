// Jobs with High AI Opportunity - Scatter Plot - Scroll-Driven Version
const opportunityTheme = window.aiVizTheme || {};
const opportunityTextPrimary = opportunityTheme.palette?.textPrimary || "#f6f7ff";
const opportunityTextMuted = opportunityTheme.palette?.textMuted || "#9da7c2";
const opportunityGridColor = opportunityTheme.gridline || "rgba(255,255,255,0.12)";
let highAIOpportunityViz = null;
let highAIOpportunityData = null;

function createHighAIOpportunity() {
    // Clear existing visualization
    d3.select("#high-ai-opportunity").selectAll("*").remove();

    const dataPromise = highAIOpportunityData ? Promise.resolve(highAIOpportunityData) : d3.csv("data/Data/fig_4.2.25.csv");
    
    dataPromise.then(function(data) {
        // Parse data
        data.forEach(function(d) {
            d.opportunity = parseFloat(d.pct_occ_scaled);
            d.salary = parseFloat(d.MedianSalary);
            d.title = d.Title;
        });

        // Cache data
        if (!highAIOpportunityData) {
            highAIOpportunityData = data;
        }

        // Filter out any invalid data points
        const validData = data.filter(d => !isNaN(d.opportunity) && !isNaN(d.salary));
        
        // Sort all jobs by opportunity score
        const sortedByOpportunity = validData.sort((a, b) => b.opportunity - a.opportunity);
        const totalJobs = sortedByOpportunity.length;
        const top30Count = Math.ceil(totalJobs * 0.3);
        const middle30Count = Math.ceil(totalJobs * 0.3);
        const bottom40Count = totalJobs - top30Count - middle30Count;
        
        // Separate into groups:
        // - Top 5: for initial bar chart
        // - Top 30%: first scatter plot
        // - Middle 30%: second scatter plot (with rescale)
        // - Bottom 40%: third scatter plot (with rescale)
        const top5Jobs = sortedByOpportunity.slice(0, 5);
        const top30Jobs = sortedByOpportunity.slice(0, top30Count);
        const middle30Jobs = sortedByOpportunity.slice(top30Count, top30Count + middle30Count);
        const bottom40Jobs = sortedByOpportunity.slice(top30Count + middle30Count);
        const allJobs = sortedByOpportunity;
        
        console.log(`Total jobs loaded: ${data.length}, Valid data points: ${validData.length}`);
        console.log(`Top 5: ${top5Jobs.length}, Top 30%: ${top30Jobs.length}, Middle 30%: ${middle30Jobs.length}, Bottom 40%: ${bottom40Jobs.length}`);

        // Set up dimensions
        const margin = { top: 80, right: 40, bottom: 100, left: 80 };
        const baseWidth = 900;
        const width = baseWidth - margin.left - margin.right;
        const height = 650 - margin.top - margin.bottom;
        const svgWidth = baseWidth;
        const svgHeight = height + margin.top + margin.bottom;

        // Create SVG
        const svg = d3.select("#high-ai-opportunity")
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
            .style("position", "fixed")
            .style("padding", "6px 10px")
            .style("border-radius", "8px")
            .style("font-size", "11px")
            .style("font-family", "'Stack Sans Notch', serif")
            .style("pointer-events", "none")
            .style("z-index", "1000");

        if (opportunityTheme.styleTooltip) {
            opportunityTheme.styleTooltip(tooltip);
        }

        // Create separate scales for each group
        // Top 30% scales
        const xScaleTop30 = d3.scaleLinear()
            .domain(d3.extent(top30Jobs, d => d.salary))
            .range([0, width])
            .nice();
        const yScaleTop30 = d3.scaleLinear()
            .domain(d3.extent(top30Jobs, d => d.opportunity))
            .range([height, 0])
            .nice();
        
        // Middle 30% scales
        const xScaleMiddle30 = d3.scaleLinear()
            .domain(d3.extent(middle30Jobs, d => d.salary))
            .range([0, width])
            .nice();
        const yScaleMiddle30 = d3.scaleLinear()
            .domain(d3.extent(middle30Jobs, d => d.opportunity))
            .range([height, 0])
            .nice();
        
        // Bottom 40% scales
        const xScaleBottom40 = d3.scaleLinear()
            .domain(d3.extent(bottom40Jobs, d => d.salary))
            .range([0, width])
            .nice();
        const yScaleBottom40 = d3.scaleLinear()
            .domain(d3.extent(bottom40Jobs, d => d.opportunity))
            .range([height, 0])
            .nice();

        // Use top 30% scale as default (for initial setup)
        const xScale = xScaleTop30;
        const yScale = yScaleTop30;

        // Color scale for opportunity (use all jobs for full range)
        const maxOpportunity = d3.max(allJobs, d => d.opportunity);
        const minOpportunity = d3.min(allJobs, d => d.opportunity);
        const colorScale = d3.scaleSequential()
            .domain([minOpportunity, maxOpportunity])
            .interpolator(d3.interpolateRgb(
                opportunityTheme.palette?.accentSecondary || "#6be2ff",
                opportunityTheme.palette?.accent || "#1fb8ff"
            ));

        // ============================================================================
        // TOP 5 BAR CHART SETUP
        // ============================================================================
        // Scale for opportunity (used for bar length in initial view)
        const opportunityScale = d3.scaleLinear()
            .domain([0, maxOpportunity])
            .range([0, width * 0.7]); // Bars use 70% of width
        
        // Calculate bar chart positions for top 5
        const barSpacing = height / 6; // Space between bars (5 bars + spacing)
        const barHeight = barSpacing * 0.6; // Height of each bar
        
        // Mark jobs with their group membership
        top5Jobs.forEach(function(d) {
            d.isTop5 = true;
            d.group = 'top30';
        });
        
        const remainingTop30 = top30Jobs.slice(5); // Jobs 6-30%
        remainingTop30.forEach(function(d) {
            d.isTop5 = false;
            d.group = 'top30';
        });
        
        middle30Jobs.forEach(function(d) {
            d.isTop5 = false;
            d.group = 'middle30';
        });
        
        bottom40Jobs.forEach(function(d) {
            d.isTop5 = false;
            d.group = 'bottom40';
        });
        
        // Calculate bar chart positions for top 5
        top5Jobs.forEach(function(d, i) {
            // Bar chart positions (horizontal bars)
            const leftMargin = 150; // Space for job title labels
            d.barX = leftMargin; // Start after title space
            d.barY = (i + 1) * barSpacing - barHeight / 2; // Vertical position
            d.barWidth = opportunityScale(d.opportunity); // Bar length = opportunity
            d.barHeight = barHeight;
            
            // Scatter plot positions (using top 30% scale)
            d.scatterX = xScaleTop30(d.salary);
            d.scatterY = yScaleTop30(d.opportunity);
            d.scatterRadius = 5;
        });
        
        // Calculate scatter positions for remaining top 30% (not in top 5)
        remainingTop30.forEach(function(d) {
            d.scatterX = xScaleTop30(d.salary);
            d.scatterY = yScaleTop30(d.opportunity);
            d.scatterRadius = 5;
            // Start hidden (will fade in during transition)
            d.barX = 0;
            d.barY = height / 2;
            d.barWidth = 0;
            d.barHeight = 0;
        });
        
        // Calculate scatter positions for middle 30%
        middle30Jobs.forEach(function(d) {
            d.scatterX = xScaleMiddle30(d.salary);
            d.scatterY = yScaleMiddle30(d.opportunity);
            d.scatterRadius = 5;
            // Start hidden (will fade in during second transition)
            d.barX = 0;
            d.barY = height / 2;
            d.barWidth = 0;
            d.barHeight = 0;
        });
        
        // Calculate scatter positions for bottom 40%
        bottom40Jobs.forEach(function(d) {
            d.scatterX = xScaleBottom40(d.salary);
            d.scatterY = yScaleBottom40(d.opportunity);
            d.scatterRadius = 5;
            // Start hidden (will fade in during third transition)
            d.barX = 0;
            d.barY = height / 2;
            d.barWidth = 0;
            d.barHeight = 0;
        });

        // Add grid lines (hidden initially, will fade in during transition)
        const gridX = g.append("g")
            .attr("class", "grid grid-x")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(8)
                .tickSize(-height)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", opportunityGridColor)
            .attr("stroke-width", 1)
            .style("opacity", 0);

        const gridY = g.append("g")
            .attr("class", "grid grid-y")
            .call(d3.axisLeft(yScale)
                .ticks(8)
                .tickSize(-width)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", opportunityGridColor)
            .attr("stroke-width", 1)
            .style("opacity", 0);

        // Create elements for all jobs (will morph from bars to scatter points)
        const elements = g.selectAll("g.job-element")
            .data(allJobs)
            .enter()
            .append("g")
            .attr("class", "job-element");
        
        // Create rectangles for top 5 bars (initial state)
        const rects = elements.append("rect")
            .attr("x", d => d.isTop5 ? d.barX : 0)
            .attr("y", d => d.isTop5 ? d.barY - d.barHeight / 2 : height / 2)
            .attr("width", d => d.isTop5 ? d.barWidth : 0)
            .attr("height", d => d.isTop5 ? d.barHeight : 0)
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", d => colorScale(d.opportunity))
            .attr("stroke", "rgba(5,6,13,0.3)")
            .attr("stroke-width", 1.5)
            .attr("opacity", d => d.isTop5 ? 0.9 : 0);
        
        // Create circles (hidden initially, will become visible during transition)
        const circles = elements.append("circle")
            .attr("cx", d => d.isTop5 ? d.barX + d.barWidth : width / 2)
            .attr("cy", d => d.isTop5 ? d.barY : height / 2)
            .attr("r", 0)
            .attr("fill", d => colorScale(d.opportunity))
            .attr("stroke", "rgba(5,6,13,0.45)")
            .attr("stroke-width", 1)
            .attr("opacity", 0);
        
        // Create labels for top 5 jobs (job title and salary)
        const labelsGroup = g.append("g")
            .attr("class", "job-labels");
        
        const labels = labelsGroup.selectAll("g.label-group")
            .data(top5Jobs)
            .enter()
            .append("g")
            .attr("class", "label-group");
        
        // Job title label (positioned to the left of bars)
        labels.append("text")
            .attr("class", "label-title")
            .attr("x", 140)
            .attr("y", d => d.barY)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("fill", opportunityTextPrimary)
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "400")
            .text(d => d.title);
        
        // Salary label (at end of bar)
        labels.append("text")
            .attr("class", "label-salary")
            .attr("x", d => d.barX + d.barWidth + 10)
            .attr("y", d => d.barY)
            .attr("dy", "0.35em")
            .attr("fill", opportunityTextMuted)
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .text(d => `$${d.salary.toLocaleString()}`);
        
        // Add mouse interactions
        elements
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`${d.title}<br/>Opportunity Score: ${d.opportunity.toFixed(2)}<br/>Salary: $${d.salary.toLocaleString()}`);
                
                d3.select(this).select("rect")
                    .attr("stroke-width", 2.5)
                    .attr("stroke", opportunityTextPrimary);
                
                d3.select(this).select("circle")
                    .attr("stroke-width", 2.5)
                    .attr("stroke", opportunityTextPrimary)
                    .attr("r", d => d.scatterRadius + 2);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.clientX) + "px")
                    .style("top", (event.clientY - 80) + "px")
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                d3.select(this).select("rect")
                    .attr("stroke-width", 1)
                    .attr("stroke", "rgba(5,6,13,0.3)");
                
                d3.select(this).select("circle")
                    .attr("stroke-width", 1)
                    .attr("stroke", "rgba(5,6,13,0.45)")
                    .attr("r", d.scatterRadius);
            });

        // Add x-axis (hidden initially)
        const xAxis = d3.axisBottom(xScale)
            .ticks(8)
            .tickFormat(d => "$" + (d / 1000) + "K");

        const xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .style("opacity", 0);

        xAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextMuted);

        // Add x-axis label (hidden initially)
        const xAxisLabel = g.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextPrimary)
            .text("Salary")
            .style("opacity", 0);

        // Add y-axis (hidden initially)
        const yAxis = d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => d.toFixed(2));

        const yAxisGroup = g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .style("opacity", 0);

        yAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextMuted);

        yAxisGroup.select(".domain")
            .attr("stroke", "none");

        const yAxisLabel = g.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextPrimary)
            .text("Opportunity")
            .style("opacity", 0);

        // Add title
        const title = svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextPrimary)
            .text("Jobs with High AI Opportunity");

        // Add subtitle (will change during transition)
        const subtitle = svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextMuted)
            .text("Top 5 jobs with highest AI opportunity scores (bar length = opportunity, salary shown)");

        highAIOpportunityViz = { 
            svg, 
            g, 
            xScale, 
            yScale,
            xScaleTop30,
            yScaleTop30,
            xScaleMiddle30,
            yScaleMiddle30,
            xScaleBottom40,
            yScaleBottom40,
            elements,
            rects,
            circles,
            top5Jobs,
            top30Jobs,
            middle30Jobs,
            bottom40Jobs,
            allJobs,
            labels,
            labelsGroup,
            xAxisGroup,
            yAxisGroup,
            xAxisLabel,
            yAxisLabel,
            gridX,
            gridY,
            title,
            subtitle,
            width,
            height
        };
        
        // Initialize with top 5 bar chart view
        updateHighAIOpportunityTransition(0);
    }).catch(function(error) {
        console.error("Error loading CSV:", error);
    });
}

// ============================================================================
// TRANSITION FUNCTION: Top 5 Bars → Top 30% Scatter → Middle 30% Scatter → Bottom 40% Scatter
// ============================================================================
function updateHighAIOpportunityTransition(scrollPercent) {
    if (!highAIOpportunityViz || !highAIOpportunityViz.allJobs) {
        return;
    }

    const viz = highAIOpportunityViz;
    const { 
        rects,
        circles,
        top5Jobs,
        top30Jobs,
        middle30Jobs,
        bottom40Jobs,
        labels,
        labelsGroup,
        xAxisGroup, 
        yAxisGroup, 
        xAxisLabel, 
        yAxisLabel, 
        gridX, 
        gridY, 
        title, 
        subtitle,
        xScaleTop30,
        yScaleTop30,
        xScaleMiddle30,
        yScaleMiddle30,
        xScaleBottom40,
        yScaleBottom40,
        width,
        height
    } = viz;
    
    // Helper function to update axes
    function updateAxes(xScale, yScale) {
        const xAxis = d3.axisBottom(xScale)
            .ticks(8)
            .tickFormat(d => "$" + (d / 1000) + "K");
        
        const yAxis = d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => d.toFixed(2));
        
        xAxisGroup.transition()
            .duration(300)
            .call(xAxis);
        
        xAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextMuted);
        
        yAxisGroup.transition()
            .duration(300)
            .call(yAxis);
        
        yAxisGroup.selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", opportunityTextMuted);
        
        // Update grid lines
        gridX.selectAll("line")
            .transition()
            .duration(300)
            .attr("x1", d => xScale(d))
            .attr("x2", d => xScale(d));
        
        gridY.selectAll("line")
            .transition()
            .duration(300)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d));
    }

    if (scrollPercent < 25) {
        // Phase 1 (0-25%): Top 5 bar chart fully visible
        rects.each(function(d) {
            if (d.isTop5) {
                d3.select(this)
                    .attr("x", d.barX)
                    .attr("y", d.barY - d.barHeight / 2)
                    .attr("width", d.barWidth)
                    .attr("height", d.barHeight)
                    .style("opacity", 0.9);
            } else {
                d3.select(this)
                    .style("opacity", 0);
            }
        });
        
        circles.each(function(d) {
            if (d.isTop5) {
                d3.select(this)
                    .attr("cx", d.barX + d.barWidth / 2)
                    .attr("cy", d.barY)
                    .attr("r", 0)
                    .style("opacity", 0);
            } else {
                d3.select(this)
                    .attr("cx", width / 2)
                    .attr("cy", height / 2)
                    .attr("r", 0)
                    .style("opacity", 0);
            }
        });
        
        if (labels) labels.style("opacity", 1);
        xAxisGroup.style("opacity", 0);
        yAxisGroup.style("opacity", 0);
        xAxisLabel.style("opacity", 0);
        yAxisLabel.style("opacity", 0);
        gridX.style("opacity", 0);
        gridY.style("opacity", 0);
        
        title.text("Top 5 Jobs with Highest AI Opportunity").style("opacity", 1);
        subtitle.text("Top 5 jobs with highest AI opportunity scores (bar length = opportunity, salary shown)").style("opacity", 1);
        
    } else if (scrollPercent >= 25 && scrollPercent < 40) {
        // Phase 2 (25-40%): Top 5 bars morph to scatter, transition to top 30% scatter plot
        const t = (scrollPercent - 25) / 15;
        
        // Top 5 bars morph to points
        rects.each(function(d) {
            if (d.isTop5) {
                if (t < 0.5) {
                    const shrinkT = t * 2;
                    const centerX = d.barX + d.barWidth / 2;
                    const centerY = d.barY;
                    const w = d.barWidth * (1 - shrinkT);
                    const h = d.barHeight * (1 - shrinkT) + d.scatterRadius * 2 * shrinkT;
                    d3.select(this)
                        .attr("x", centerX - w / 2)
                        .attr("y", centerY - h / 2)
                        .attr("width", w)
                        .attr("height", h)
                        .attr("rx", 4 * (1 - shrinkT) + d.scatterRadius * shrinkT)
                        .attr("ry", 4 * (1 - shrinkT) + d.scatterRadius * shrinkT)
                        .style("opacity", 0.9);
                } else {
                    const moveT = (t - 0.5) * 2;
                    const startX = d.barX + d.barWidth / 2;
                    const startY = d.barY;
                    const x = startX + (d.scatterX - startX) * moveT;
                    const y = startY + (d.scatterY - startY) * moveT;
                    d3.select(this)
                        .attr("x", x - d.scatterRadius)
                        .attr("y", y - d.scatterRadius)
                        .attr("width", d.scatterRadius * 2)
                        .attr("height", d.scatterRadius * 2)
                        .attr("rx", d.scatterRadius)
                        .attr("ry", d.scatterRadius)
                        .style("opacity", 0.9 * (1 - moveT));
                }
            } else {
                d3.select(this).style("opacity", 0);
            }
        });
        
        circles.each(function(d) {
            if (d.group === 'top30') {
                if (d.isTop5) {
                    if (t < 0.5) {
                        d3.select(this)
                            .attr("cx", d.barX + d.barWidth / 2)
                            .attr("cy", d.barY)
                            .attr("r", 0)
                            .style("opacity", 0);
                    } else {
                        const moveT = (t - 0.5) * 2;
                        const startX = d.barX + d.barWidth / 2;
                        const startY = d.barY;
                        const cx = startX + (d.scatterX - startX) * moveT;
                        const cy = startY + (d.scatterY - startY) * moveT;
                        d3.select(this)
                            .attr("cx", cx)
                            .attr("cy", cy)
                            .attr("r", d.scatterRadius)
                            .style("opacity", 0.8 * moveT);
                    }
                } else {
                    // Remaining top 30% appear
                    const cx = width / 2 + (d.scatterX - width / 2) * t;
                    const cy = height / 2 + (d.scatterY - height / 2) * t;
                    d3.select(this)
                        .attr("cx", cx)
                        .attr("cy", cy)
                        .attr("r", d.scatterRadius * t)
                        .style("opacity", 0.8 * t);
                }
            } else {
                d3.select(this)
                    .attr("cx", width / 2)
                    .attr("cy", height / 2)
                    .attr("r", 0)
                    .style("opacity", 0);
            }
        });
        
        if (labels) labels.style("opacity", 1 - t);
        
        // Update axes to top 30% scale
        if (scrollPercent >= 32) {
            updateAxes(xScaleTop30, yScaleTop30);
            const axesOpacity = Math.min(1, (scrollPercent - 32) / 8);
            xAxisGroup.style("opacity", axesOpacity);
            yAxisGroup.style("opacity", axesOpacity);
            xAxisLabel.style("opacity", axesOpacity);
            yAxisLabel.style("opacity", axesOpacity);
            gridX.style("opacity", axesOpacity);
            gridY.style("opacity", axesOpacity);
        }
        
        title.text("Top 30% of Jobs by AI Opportunity").style("opacity", 1);
        subtitle.text("Jobs with highest AI opportunity scores").style("opacity", 1);
        
    } else if (scrollPercent >= 40 && scrollPercent < 65) {
        // Phase 3 (40-65%): Top 30% scatter plot fully visible (viewing time)
        circles.each(function(d) {
            if (d.group === 'top30') {
                d3.select(this)
                    .attr("cx", d.scatterX)
                    .attr("cy", d.scatterY)
                    .attr("r", d.scatterRadius)
                    .style("opacity", 0.8);
            } else {
                d3.select(this)
                    .style("opacity", 0);
            }
        });
        
        rects.each(function(d) {
            d3.select(this).style("opacity", 0);
        });
        
        if (labels) labels.style("opacity", 0);
        
        // Keep axes at top 30% scale
        updateAxes(xScaleTop30, yScaleTop30);
        xAxisGroup.style("opacity", 1);
        yAxisGroup.style("opacity", 1);
        xAxisLabel.style("opacity", 1);
        yAxisLabel.style("opacity", 1);
        gridX.style("opacity", 1);
        gridY.style("opacity", 1);
        
        title.text("Top 30% of Jobs by AI Opportunity").style("opacity", 1);
        subtitle.text("Jobs with highest AI opportunity scores").style("opacity", 1);
        
    } else if (scrollPercent >= 65 && scrollPercent < 75) {
        // Phase 4 (65-75%): Transition to middle 30% scatter plot
        const t = (scrollPercent - 65) / 10;
        
        // Hide top 30% and bottom 40%
        circles.each(function(d) {
            if (d.group === 'middle30') {
                // Middle 30% appear from center
                const cx = width / 2 + (d.scatterX - width / 2) * t;
                const cy = height / 2 + (d.scatterY - height / 2) * t;
                d3.select(this)
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", d.scatterRadius * t)
                    .style("opacity", 0.8 * t);
            } else {
                // Hide other groups
                d3.select(this)
                    .style("opacity", 0);
            }
        });
        
        rects.each(function(d) {
            d3.select(this).style("opacity", 0);
        });
        
        if (labels) labels.style("opacity", 0);
        
        // Update axes to middle 30% scale
        updateAxes(xScaleMiddle30, yScaleMiddle30);
        xAxisGroup.style("opacity", 1);
        yAxisGroup.style("opacity", 1);
        xAxisLabel.style("opacity", 1);
        yAxisLabel.style("opacity", 1);
        gridX.style("opacity", 1);
        gridY.style("opacity", 1);
        
        title.text("Middle 30% of Jobs by AI Opportunity").style("opacity", 1);
        subtitle.text("Jobs with moderate AI opportunity scores").style("opacity", 1);
        
    } else if (scrollPercent >= 75 && scrollPercent < 90) {
        // Phase 5 (75-90%): Middle 30% scatter plot fully visible (viewing time)
        circles.each(function(d) {
            if (d.group === 'middle30') {
                d3.select(this)
                    .attr("cx", d.scatterX)
                    .attr("cy", d.scatterY)
                    .attr("r", d.scatterRadius)
                    .style("opacity", 0.8);
            } else {
                d3.select(this)
                    .style("opacity", 0);
            }
        });
        
        rects.each(function(d) {
            d3.select(this).style("opacity", 0);
        });
        
        if (labels) labels.style("opacity", 0);
        
        // Keep axes at middle 30% scale
        updateAxes(xScaleMiddle30, yScaleMiddle30);
        xAxisGroup.style("opacity", 1);
        yAxisGroup.style("opacity", 1);
        xAxisLabel.style("opacity", 1);
        yAxisLabel.style("opacity", 1);
        gridX.style("opacity", 1);
        gridY.style("opacity", 1);
        
        title.text("Middle 30% of Jobs by AI Opportunity").style("opacity", 1);
        subtitle.text("Jobs with moderate AI opportunity scores").style("opacity", 1);
        
    } else if (scrollPercent >= 90 && scrollPercent < 100) {
        // Phase 6 (90-100%): Transition to bottom 40% scatter plot
        const t = (scrollPercent - 90) / 10;
        
        // Hide top 30% and middle 30%
        circles.each(function(d) {
            if (d.group === 'bottom40') {
                // Bottom 40% appear from center
                const cx = width / 2 + (d.scatterX - width / 2) * t;
                const cy = height / 2 + (d.scatterY - height / 2) * t;
                d3.select(this)
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", d.scatterRadius * t)
                    .style("opacity", 0.8 * t);
            } else {
                // Hide other groups
                d3.select(this)
                    .style("opacity", 0);
            }
        });
        
        rects.each(function(d) {
            d3.select(this).style("opacity", 0);
        });
        
        if (labels) labels.style("opacity", 0);
        
        // Update axes to bottom 40% scale
        updateAxes(xScaleBottom40, yScaleBottom40);
        xAxisGroup.style("opacity", 1);
        yAxisGroup.style("opacity", 1);
        xAxisLabel.style("opacity", 1);
        yAxisLabel.style("opacity", 1);
        gridX.style("opacity", 1);
        gridY.style("opacity", 1);
        
        title.text("Bottom 40% of Jobs by AI Opportunity").style("opacity", 1);
        subtitle.text("Jobs with lower AI opportunity scores").style("opacity", 1);
        
    } else {
        // Phase 7 (100%): Bottom 40% scatter plot fully visible
        circles.each(function(d) {
            if (d.group === 'bottom40') {
                d3.select(this)
                    .attr("cx", d.scatterX)
                    .attr("cy", d.scatterY)
                    .attr("r", d.scatterRadius)
                    .style("opacity", 0.8);
            } else {
                d3.select(this)
                    .style("opacity", 0);
            }
        });
        
        rects.each(function(d) {
            d3.select(this).style("opacity", 0);
        });
        
        if (labels) labels.style("opacity", 0);
        
        // Keep axes at bottom 40% scale
        updateAxes(xScaleBottom40, yScaleBottom40);
        xAxisGroup.style("opacity", 1);
        yAxisGroup.style("opacity", 1);
        xAxisLabel.style("opacity", 1);
        yAxisLabel.style("opacity", 1);
        gridX.style("opacity", 1);
        gridY.style("opacity", 1);
        
        title.text("Bottom 40% of Jobs by AI Opportunity").style("opacity", 1);
        subtitle.text("Jobs with lower AI opportunity scores").style("opacity", 1);
    }
}

// Initialize on load
$(document).ready(function() {
    setTimeout(createHighAIOpportunity, 500);
});
