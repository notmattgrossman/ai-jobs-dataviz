// Scroll-Watcher Integration for Narrative Visualizations
// Text is now static HTML, so we only need to handle visualization updates

$(document).ready(function() {
    // Initialize scroll watchers - wait a bit longer to ensure all elements are rendered
    setTimeout(initScrollNarrative, 2000);
});

// Function to handle section 1 scroll updates
function handleSection1Scroll(scrollPercent) {
    // Always show 'all' functions and animate rows based on scroll progress
    // Map scrollPercent (0-100% through section) directly to animation progress (0-100% of rows)
    const animationPercent = Math.max(0, Math.min(100, scrollPercent));
    
    // Always use 'all' filter state so all rows are available for animation
    updateIndustryOutlook('all', animationPercent);
}

function initScrollNarrative() {
    // Section 1: Industry Outlook - Set up manual scroll handler
    const $section1 = $('#section-1');
    
    if ($section1.length === 0) {
        setTimeout(initScrollNarrative, 500);
        return;
    }
    
    let lastScrollPercent = -1;
    let scrollHandlerAttached = false;
    
    function setupSection1ScrollHandler() {
        if (scrollHandlerAttached) return;
        
        const section1 = $section1[0];
        if (!section1) return;
        
        function onScroll() {
            const rect = section1.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const sectionTop = rect.top;
            const sectionHeight = rect.height;
            
            // Calculate scroll progress through section
            let scrollPercent = 0;
            if (sectionTop < 0 && sectionTop + sectionHeight > windowHeight) {
                // Section is in viewport and being scrolled through
                const scrolled = Math.abs(sectionTop);
                const totalScrollable = sectionHeight - windowHeight;
                if (totalScrollable > 0) {
                    scrollPercent = Math.min(100, Math.max(0, (scrolled / totalScrollable) * 100));
                }
            } else if (sectionTop >= 0) {
                // Section hasn't reached viewport yet
                scrollPercent = 0;
            } else {
                // Section has been scrolled past
                scrollPercent = 100;
            }
            
            // Update if scroll percent changed
            if (Math.abs(scrollPercent - lastScrollPercent) > 0.1) {
                lastScrollPercent = scrollPercent;
                handleSection1Scroll(scrollPercent);
            }
        }
        
        // Use requestAnimationFrame for smooth scrolling
        let ticking = false;
        function requestTick() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    onScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        $(window).on('scroll', requestTick);
        $(window).on('resize', requestTick);
        onScroll(); // Initial call
        scrollHandlerAttached = true;
    }
    
    // Set up scroll handler immediately
    setupSection1ScrollHandler();
    
    // Also try scrollWatcher (will fail but that's ok)
    try {
        scrollWatcher({
            parent: '#section-1',
            onUpdate: function(scrollPercent) {
                handleSection1Scroll(scrollPercent);
            }
        });
    } catch (error) {
        // scrollWatcher failed, manual handler will work
    }

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
