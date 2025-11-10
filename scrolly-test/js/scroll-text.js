// Dynamic Text Content for Scroll-Driven Narrative
const textSections = [
    {
        id: 'section-1-overall',
        content: `
            <div class="text-section">
                <h3>The threat: <em>What jobs does AI threaten? Who will be most impacted?</em></h3>
                <p>A generation of college students in America were told a <a href="https://www.nytimes.com/2025/09/29/podcasts/the-daily/big-tech-told-kids-to-code-the-jobs-didnt-follow.html" target="_blank">simple story</a>: go to college, learn to code, and graduate into a job with a six-figure salary, private chef lunches, and massages at work. For two decades, this was the case.</p>
                <p>Now, as the AI wave just starts to crash onto the technology industry, that story is beginning to crack.</p>
            </div>
        `
    },
    {
        id: 'section-1-all',
        content: `
            <div class="text-section">
                <p>When surveyed, professionals across industries reported their anticipated changes in workforce size. The most optimistic response came from the IT sector and the most pessimistic was from HR.</p>
                <p>Looking across all functions, we can see a wide range of expectations. Some sectors anticipate growth, while others prepare for significant reductions.</p>
            </div>
        `
    },
    {
        id: 'section-1-it',
        content: `
            <div class="text-section">
                <p>While the IT sector shows overall optimism, that optimism is not evenly distributed. Based on vulnerability scores, many jobs in the IT sector are at high risk of being replaced by AI.</p>
                <p>The technology industry faces a paradox: it's creating AI tools that threaten its own workforce.</p>
            </div>
        `
    },
    {
        id: 'section-2-bubbles',
        content: `
            <div class="text-section">
                <p>Based on vulnerability scores, many jobs in the IT sector are at high risk of being replaced by AI. The larger the circle, the higher the risk score.</p>
                <p>These aren't just low-skilled positions. Many high-paying tech jobs are vulnerable.</p>
            </div>
        `
    },
    {
        id: 'section-2-scatter',
        content: `
            <div class="text-section">
                <p>Unlike previous technological revolutions, AI is not just replacing lower-skilled, lower-paying jobs. Many of the highest paying jobs are also at the highest risk of being replaced by AI.</p>
                <p>As the visualization transitions, we can see the relationship between risk score and salary more clearly.</p>
            </div>
        `
    }
];

let currentTextSection = null;

function updateText(sectionId) {
    const textContent = document.getElementById('text-content');
    const section = textSections.find(s => s.id === sectionId);
    
    if (section && currentTextSection !== sectionId) {
        textContent.innerHTML = section.content;
        currentTextSection = sectionId;
    }
}

function getTextSectionForScroll(sectionNum, scrollPercent) {
    if (sectionNum === 1) {
        if (scrollPercent < 0.33) {
            return 'section-1-overall';
        } else if (scrollPercent < 0.66) {
            return 'section-1-all';
        } else {
            return 'section-1-it';
        }
    } else if (sectionNum === 2) {
        if (scrollPercent < 0.5) {
            return 'section-2-bubbles';
        } else {
            return 'section-2-scatter';
        }
    }
    return null;
}

