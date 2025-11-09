
document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data/4. Economy/Data/fig_4.2.1.csv").then(rawData => {
        // const cleanedData = rawData
        //     .filter(d => d.Country && d.AI_Jobs)
        //     .map(d => ({
        //         country: d.Country.trim(),
        //         year: +d.Year,
        //         aiJobs: +d.AI_Jobs.replace(/,/g, "")
        //     }));

        const cleanedData = rawData
            .filter(d => d["AI job postings (% of all job postings)"] !== "")

            .map(d => ({
                country: d["Geographic area"].trim(),
                year: +d["Year"],
                aiShare: parseFloat(
                    d["AI job postings (% of all job postings)"].replace("%", "")
                ) / 100
            }));

        console.log("CLEANED GLOBAL AI DATA:", cleanedData);

        // console.log("Raw Data:", rawData);

        // Promise.all([
        //     d3.csv("data/4. Economy/Data/fig_4.2.1.csv"),   // AI job postings (%)
        //     d3.csv("data/4. Economy/Data/fig_4.2.9.csv"),   // Global AI job market share
        //     d3.csv("data/4. Economy/Data/fig_4.3.6.csv"),   // AI exposure index
        //     d3.csv("data/4. Economy/Data/fig_4.4.6.csv"),   // Regional AI adoption
        //     d3.csv("data/4. Economy/Data/fig_4.5.1.csv"),   // AI research papers by country
        //     d3.csv("data/4. Economy/Data/fig_4.5.6.csv")    // AI research impact / citations
        // ]).then(([raw421, raw429, raw436, raw446, raw451, raw456]) => {

        //     console.log("RAW 4.2.1 (AI Job Share):", raw421.slice(0, 5));
        //     console.log("RAW 4.2.9 (Global Job Market Share):", raw429.slice(0, 5));
        //     console.log("RAW 4.3.6 (AI Exposure):", raw436.slice(0, 5));
        //     console.log("RAW 4.4.6 (AI Adoption Regions):", raw446.slice(0, 5));
        //     console.log("RAW 4.5.1 (AI Research Output):", raw451.slice(0, 5));
        //     console.log("RAW 4.5.6 (AI Research Influence):", raw456.slice(0, 5));

        //     console.log("COLUMNS 4.2.1:", Object.keys(raw421[0]));
        //     console.log("COLUMNS 4.2.9:", Object.keys(raw429[0]));
        //     console.log("COLUMNS 4.3.6:", Object.keys(raw436[0]));
        //     console.log("COLUMNS 4.4.6:", Object.keys(raw446[0]));
        //     console.log("COLUMNS 4.5.1:", Object.keys(raw451[0]));
        //     console.log("COLUMNS 4.5.6:", Object.keys(raw456[0]));
        // });
    });
});