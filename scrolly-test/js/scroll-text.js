// Text content for each section - matching the original index.html structure
const sectionTexts = {
    0: `<h1>How AI is Reshaping the Job Market Around Itself</h1>
        <h2>A data exploration of the AI's impact on the shifting labor market</h2>
        <h3>The threat: <em>What jobs does AI threaten? Who will be most impacted?</em></h3>
        <p>A generation of college students in America were told a <a
            href="https://www.nytimes.com/2025/09/29/podcasts/the-daily/big-tech-told-kids-to-code-the-jobs-didnt-follow.html"
            target="_blank">simple story</a>: go to college, learn to code, and graduate into a job with a six-figure
        salary, private chef lunches, and massages at work. For two decades, this was the case.</p>
        <p>Now, as the AI wave just starts to crash onto the technology industry, that story is beginning to crack.</p>
        <p>When surveyed, professionals across industries reported their anticipated changes in workforce size. The most
        optimistic response came from the IT sector and the most pessimistic was from HR.</p>`,
    
    1: `<p>While the IT sector is most optimisitc, that optimism is not evenly distributed. Based on vulnerability scores,
        many jobs in the IT sector are at high risk of being replaced by AI.</p>`,
    
    2: `<p>Unlike previous technological revolutions, AI is not just replacing lower-skilled, lower-paying jobs. Many of the
        highest paying jobs are also at the highest risk of being replaced by AI.</p>
        <p>Wether tech workers are ready for it or not, the AI revolution is here to stay. The key now is to stay ahead of
        the puck, use it to your advantage, and be ready to adapt.</p>`,
    
    3: `<h3>The Growth: <em>What skills are in highest demand? What opportunities are growing?</em></h3>
        <p>As AI transforms the job market, certain skills are experiencing explosive growth. Understanding which AI-complementary skills are in highest demand can help job seekers position themselves for success in the AI era.</p>
        <p>Tracking the evolution of AI skill demand over time reveals which skills are gaining momentum and which are stabilizing. The demand index shows how each skill's market presence has changed from 2017 to 2025, with projections indicating future trends.</p>`,
    
    4: `<p>Not all jobs are created equal when it comes to AI opportunity. Jobs with high AI opportunity scores represent positions where AI transformation is most likely, creating new roles and requiring workers to adapt and work alongside AI technologies. These opportunities span across salary ranges, showing that AI is reshaping the job market at all levels.</p>
        <p>Together, these trends show a job market in rapid transformation. The skills growing today will define the jobs of tomorrow, and opportunities exist across all salary levels for those ready to adapt.</p>`,
    
    5: `<h3>What to know: <em>Where is AI concentrated geographically?</em></h3>
        <p>AI job postings are not distributed evenly across the globe. While some countries see significant AI hiring
        activity, others lag behind. The size of each circle represents the volume of AI job postings relative to
        population.</p>
        <p>The global map reveals clear gerographic conventration in North America and Western Europe which dominate AI
        hiring. A notable missing data point is China and India which both don't have data within our datasets.</p>`,
    
    6: `<p>Zooming in on the most prominent AI hiring hub, the United States it is clear that states such as California,
        Texas, and New York account for the majority share of AI job postings underscoring the clustering of AI
        innovation in the US.</p>
        <p>Together, these maps demonstrate the rise of AI in the job market is not a global wave, but a selective surge
        concentrated in a few countries and cities. The geographic imbalance suggests access to AI opportunities is
        uneven worldwide.</p>`
};

function updateText(sectionNum) {
    const textContent = document.getElementById('text-content');
    if (!textContent) {
        console.error('text-content element not found');
        return;
    }
    if (!sectionTexts[sectionNum]) {
        console.error('No text found for section', sectionNum);
        return;
    }
    textContent.innerHTML = sectionTexts[sectionNum];
    console.log('Text updated for section', sectionNum);
}
