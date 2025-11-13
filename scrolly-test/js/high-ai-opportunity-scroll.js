// Jobs with High AI Opportunity - Scatter Plot - Scroll-Driven Version
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
        
        // Filter for jobs with high AI opportunity (top 30% by opportunity score)
        const sortedByOpportunity = validData.sort((a, b) => b.opportunity - a.opportunity);
        const top30Percent = Math.ceil(sortedByOpportunity.length * 0.3);
        const highOpportunityJobs = sortedByOpportunity.slice(0, top30Percent);
        
        console.log(`Total jobs loaded: ${data.length}, Valid data points: ${validData.length}, High opportunity jobs: ${highOpportunityJobs.length}`);

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
            .style("position", "absolute")
            .style("background-color", "#2c3e50")
            .style("color", "#F0EEE6")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "11px")
            .style("font-family", "'Merriweather', serif")
            .style("pointer-events", "none")
            .style("z-index", "1000");

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(highOpportunityJobs, d => d.salary))
            .range([0, width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain(d3.extent(highOpportunityJobs, d => d.opportunity))
            .range([height, 0])
            .nice();

        // Color scale for opportunity
        const maxOpportunity = d3.max(highOpportunityJobs, d => d.opportunity);
        const minOpportunity = d3.min(highOpportunityJobs, d => d.opportunity);
        const colorScale = d3.scaleSequential()
            .domain([minOpportunity, maxOpportunity])
            .interpolator(d3.interpolateRgb("#2d5016", "#b2182b"));

        // Add grid lines first
        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(8)
                .tickSize(-height)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);

        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .ticks(8)
                .tickSize(-width)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);

        // Create circles
        const circles = g.selectAll("circle")
            .data(highOpportunityJobs)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.salary))
            .attr("cy", d => yScale(d.opportunity))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.opportunity))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`${d.title}<br/>Opportunity Score: ${d.opportunity.toFixed(2)}<br/>Salary: $${d.salary.toLocaleString()}`);
                
                d3.select(this)
                    .attr("stroke-width", 2.5)
                    .attr("stroke", "#333")
                    .attr("r", 7)
                    .attr("opacity", 1);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 60) + "px")
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                d3.select(this)
                    .attr("stroke-width", 1)
                    .attr("stroke", "#fff")
                    .attr("r", 5)
                    .attr("opacity", 0.7);
            });

        // Add x-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(8)
            .tickFormat(d => "$" + (d / 1000) + "K");

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Merriweather', serif")
            .attr("fill", "#2c3e50");

        // Add x-axis label
        g.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "600")
            .attr("fill", "#2c3e50")
            .text("Salary");

        // Add y-axis
        const yAxis = d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => d.toFixed(2));

        g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll("text")
            .attr("font-size", "11px")
            .attr("font-family", "'Merriweather', serif")
            .attr("fill", "#2c3e50");

        g.select(".y-axis").select(".domain")
            .attr("stroke", "none");

        g.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "600")
            .attr("fill", "#2c3e50")
            .text("Opportunity");

        // Add title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "600")
            .attr("fill", "#2c3e50")
            .text("Jobs with High AI Opportunity");

        // Add subtitle
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "'Merriweather', serif")
            .attr("font-weight", "400")
            .attr("fill", "#2c3e50")
            .text("Top 30% of jobs by AI opportunity score (higher score = greater AI transformation potential)");

        highAIOpportunityViz = { svg, g, xScale, yScale, circles };
    }).catch(function(error) {
        console.error("Error loading CSV:", error);
    });
}

// Initialize on load
$(document).ready(function() {
    setTimeout(createHighAIOpportunity, 500);
});

