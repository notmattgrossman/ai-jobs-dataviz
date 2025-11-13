// Scroll-Watcher Integration for Narrative Visualizations
// Text is now static HTML, so we only need to handle visualization updates

$(document).ready(function() {
    // Initialize scroll watchers
    setTimeout(initScrollNarrative, 1000);
});

function initScrollNarrative() {
    // Section 1: Industry Outlook
    scrollWatcher({
        parent: '#section-1',
        onUpdate: function(scrollPercent) {
            if (scrollPercent < 0.33) {
                updateIndustryOutlook('overall');
            } else if (scrollPercent < 0.66) {
                updateIndustryOutlook('all');
            } else {
                updateIndustryOutlook('it');
            }
        }
    });

    // Section 2: Tech Job Vulnerability (Bubble)
    scrollWatcher({
        parent: '#section-2',
        onUpdate: function(scrollPercent) {
            if (scrollPercent > 0.1 && !techJobVulnerabilityViz) {
                createTechJobVulnerability();
            }
        }
    });

    // Section 3: Tech Job Vulnerability Scatter
    scrollWatcher({
        parent: '#section-3',
        onUpdate: function(scrollPercent) {
            if (scrollPercent > 0.1 && !techJobVulnerabilityScatterViz) {
                createTechJobVulnerabilityScatter();
            }
        }
    });

    // Section 4: Skill Demand Changes
    scrollWatcher({
        parent: '#section-4',
        onUpdate: function(scrollPercent) {
            if (scrollPercent > 0.1 && !skillDemandChangesViz) {
                createSkillDemandChanges();
            }
        }
    });

    // Section 5: High AI Opportunity
    scrollWatcher({
        parent: '#section-5',
        onUpdate: function(scrollPercent) {
            if (scrollPercent > 0.1 && !highAIOpportunityViz) {
                createHighAIOpportunity();
            }
        }
    });

    // Section 6: Global Map
    scrollWatcher({
        parent: '#section-6',
        onUpdate: function(scrollPercent) {
            if (scrollPercent > 0.1 && !globalMapViz) {
                createGlobalMap();
            }
        }
    });

    // Section 7: US Map
    scrollWatcher({
        parent: '#section-7',
        onUpdate: function(scrollPercent) {
            if (scrollPercent > 0.1 && !usMapViz) {
                createUSMap();
            }
        }
    });
}
