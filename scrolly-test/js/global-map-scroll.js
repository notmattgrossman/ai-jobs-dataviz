let globalMapViz = null;
let globalMapData = null;
let globalMapSvg = null;
let globalMapTitle = null;
let globalCurrentYearIndex = 0;
const globalMapTheme = window.aiVizTheme || {};
const globalTextPrimary = globalMapTheme.palette?.textPrimary || "#f6f7ff";
const globalSurface = globalMapTheme.palette?.surface || "#0e111f";
const globalBorder = "#fff";
const availableYears = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];

async function createGlobalMap() {
    d3.select("#global-map").selectAll("*").remove();

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

    if (globalMapTheme.styleTooltip) {
        globalMapTheme.styleTooltip(tooltip);
    }

    try {
        // Load data
        if (!globalMapData) {
            const filePromises = [];
            for (let i = 1; i <= 25; i++) {
                filePromises.push(d3.csv(`data/Data/fig_4.2.${i}.csv`).catch(() => null));
            }
            const rawData = await Promise.all(filePromises);
            globalMapData = rawData.filter(d => d).flat();
        }

        const width = 1200, height = 700;
        const margin = { top: 60, right: 20, bottom: 40, left: 20 };

        globalMapSvg = d3.select("#global-map")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const projection = d3.geoMercator()
            .center([0, 20])
            .translate([width / 2, height / 2])
            .scale(180);
        const path = d3.geoPath().projection(projection);

        const countryId = {
            "United States": 840, "Canada": 124, "Mexico": 484, "Brazil": 76, "Argentina": 32, "Chile": 152,
            "United Kingdom": 826, "Ireland": 372, "France": 250, "Spain": 724, "Portugal": 620, "Germany": 276,
            "Netherlands": 528, "Belgium": 56, "Luxembourg": 442, "Switzerland": 756, "Austria": 40, "Sweden": 752,
            "Poland": 616, "Czechia": 203, "Czech Republic": 203, "Italy": 380, "China": 156, "Japan": 392,
            "South Korea": 410, "India": 356, "Australia": 36, "Singapore": 702, "Hong Kong": 344,
            "United Arab Emirates": 784, "UAE": 784, "Croatia": 191, "New Zealand": 554
        };

        const countrypopulation = {
            "United States": 335, "Canada": 39, "Mexico": 128, "Brazil": 215, "Argentina": 46, "Chile": 19,
            "United Kingdom": 67, "Ireland": 5, "France": 68, "Spain": 48, "Portugal": 10, "Germany": 84,
            "Netherlands": 17, "Belgium": 12, "Luxembourg": 0.65, "Switzerland": 9, "Austria": 9, "Sweden": 10,
            "Poland": 38, "Czechia": 10.5, "Czech Republic": 10.5, "Italy": 59, "China": 1425, "Japan": 125,
            "South Korea": 52, "India": 1428, "Australia": 26, "Singapore": 6, "Hong Kong": 7.5,
            "United Arab Emirates": 9.9, "UAE": 9.9, "Croatia": 3.9, "New Zealand": 5.1
        };

        const manualCoords = {
            250: [2.5, 46.5],    // France
            826: [-2, 54],       // UK
            528: [5.5, 52.3],    // Netherlands
            620: [-8, 39.5],     // Portugal
            724: [-4, 40],       // Spain
            344: [114.1694, 22.3193],  // Hong Kong
            702: [103.8198, 1.3521],   // Singapore
            784: [54.3773, 24.4539]    // United Arab Emirates
        };

        const world = await d3.json("../topojson/world-110m.json");
        const countries = topojson.feature(world, world.objects.countries).features;

        globalMapSvg.selectAll("path")
            .data(countries)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", globalSurface)
            .attr("stroke", globalBorder)
            .attr("stroke-width", 0.8);

        globalMapTitle = globalMapSvg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-family", "'Stack Sans Notch', serif")
            .attr("font-weight", "300")
            .attr("fill", globalTextPrimary)
            .text(`Global AI Job Posting Concentration (${availableYears[globalCurrentYearIndex]})`);

        function getCircleDataForYear(year) {
            const yearData = globalMapData.filter(d => d.Year === year);
            const circleData = [];

            yearData.forEach(row => {
                const country = row["Geographic area"]?.trim();
                if (!country) return;

                const percent = parseFloat(row["AI job postings (% of all job postings)"]?.replace("%", ""));
                if (isNaN(percent)) return;

                const id = countryId[country];
                if (!id) return;

                const population = countrypopulation[country];
                if (!population) return;

                if (country === "Hong Kong" || country === "Singapore" || country === "United Arab Emirates") {
                    circleData.push({
                        country: country,
                        value: percent,
                        size: percent * population,
                        coords: manualCoords[id]
                    });
                } else {
                    const feature = countries.find(f => f.id === id);
                    if (!feature) return;

                    circleData.push({
                        country: country,
                        value: percent,
                        size: percent * population,
                        coords: manualCoords[id] || d3.geoCentroid(feature)
                    });
                }
            });
            return circleData;
        }

        const allCircleData = [];
        availableYears.forEach(year => {
            allCircleData.push(...getCircleDataForYear(year));
        });

        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(allCircleData, d => d.size)])
            .range([4, 32]);

        const circleColor = d3.scaleSequential()
            .domain(d3.extent(allCircleData, d => d.value))
            .interpolator(d3.interpolateRgb(
                globalMapTheme.palette?.divergingPositive || globalMapTheme.palette?.accentSecondary || "#43cbff",
                globalMapTheme.palette?.divergingNegative || globalMapTheme.palette?.negative || "#ff5c8d"
            ));

        let circles = globalMapSvg.selectAll("circle")
            .data(getCircleDataForYear(availableYears[globalCurrentYearIndex]), d => d.country);

        circles.enter()
            .append("circle")
            .attr("transform", d => `translate(${projection(d.coords)})`)
            .attr("r", d => radiusScale(d.size))
            .attr("fill", d => circleColor(d.value))
            .attr("fill-opacity", 0.85)
            .attr("stroke", "rgba(5,6,13,0.8)")
            .attr("stroke-width", 0.8)
            .on("mouseover", function (event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(
                    `${d.country}<br/>` +
                    `${d.value}% of all job postings are AI-related`
                );
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

        globalMapViz = {
            svg: globalMapSvg,
            projection,
            path,
            radiusScale,
            circleColor,
            tooltip,
            getCircleDataForYear
        };

    } catch (error) {
        console.error("Error loading global map:", error);
    }
}

function updateGlobalMapYear(yearIndex) {
    if (!globalMapViz || !globalMapSvg || !globalMapTitle) return;

    const year = availableYears[yearIndex];
    const newData = globalMapViz.getCircleDataForYear(year);

    globalMapTitle.transition()
        .duration(600)
        .style("opacity", 0)
        .transition()
        .duration(0)
        .text(`Global AI Job Posting Concentration (${year})`)
        .transition()
        .duration(600)
        .style("opacity", 1);

    let circles = globalMapSvg.selectAll("circle")
        .data(newData, d => d.country);

    circles.enter()
        .append("circle")
        .attr("transform", d => `translate(${globalMapViz.projection(d.coords)})`)
        .attr("r", 0)
        .attr("fill", d => globalMapViz.circleColor(d.value))
        .attr("fill-opacity", 0)
        .attr("stroke", "rgba(5,6,13,0.8)")
        .attr("stroke-width", 0.8)
        .on("mouseover", function (event, d) {
            globalMapViz.tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            globalMapViz.tooltip.html(
                `${d.country}<br/>` +
                `${d.value}% of all job postings are AI-related`
            );
        })
        .on("mousemove", function (event, d) {
            globalMapViz.tooltip
                .style("left", (event.clientX) + "px")
                .style("top", (event.clientY - 80) + "px")
                .style("transform", "translateX(-50%)");
        })
        .on("mouseout", function () {
            globalMapViz.tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(800)
        .attr("r", d => globalMapViz.radiusScale(d.size))
        .attr("fill-opacity", 0.85);

    circles.transition()
        .duration(800)
        .attr("r", d => globalMapViz.radiusScale(d.size))
        .attr("fill", d => globalMapViz.circleColor(d.value))
        .attr("fill-opacity", 0.85);

    circles.exit()
        .transition()
        .duration(800)
        .attr("r", 0)
        .attr("fill-opacity", 0)
        .remove();

    globalCurrentYearIndex = yearIndex;
}

function setupGlobalMapScrollObserver() {
    const section = document.getElementById('section-6');
    if (!section) {
        console.error('Section-6 not found');
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

            const rawIndex = scrollProgress * (availableYears.length - 1);
            const targetYearIndex = Math.round(rawIndex);
            const clampedIndex = Math.max(0, Math.min(availableYears.length - 1, targetYearIndex));

            if (clampedIndex !== globalCurrentYearIndex) {
                console.log(`Updating to year: ${availableYears[clampedIndex]} (index: ${clampedIndex}, progress: ${scrollProgress.toFixed(2)})`);
                updateGlobalMapYear(clampedIndex);
            }
        } else if (sectionTop > 0) {
            if (globalCurrentYearIndex !== 0) {
                updateGlobalMapYear(0);
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
        createGlobalMap().then(() => {
            setupGlobalMapScrollObserver();
        });
    }, 500);
});

