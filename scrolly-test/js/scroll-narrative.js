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

    // Section 2: Tech Job Vulnerability (Bubble to Scatter Transition) - Manual scroll handler
    const $section2 = $('#section-2');
    
    if ($section2.length > 0) {
        let lastScrollPercent2 = -1;
        let scrollHandlerAttached2 = false;
        
        function setupSection2ScrollHandler() {
            if (scrollHandlerAttached2) return;
            
            const section2 = $section2[0];
            if (!section2) return;
            
            function onScroll2() {
                const rect = section2.getBoundingClientRect();
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
                
                // Initialize visualization if needed
                if (scrollPercent > 0.1 && !techJobVulnerabilityViz) {
                    createTechJobVulnerability();
                    // Wait a bit for simulation to settle before updating
                    setTimeout(function() {
                        updateTechVulnerabilityTransition(scrollPercent);
                    }, 1000);
                } else if (techJobVulnerabilityViz) {
                    // Update if scroll percent changed
                    if (Math.abs(scrollPercent - lastScrollPercent2) > 0.1) {
                        lastScrollPercent2 = scrollPercent;
                        updateTechVulnerabilityTransition(scrollPercent);
                    }
                }
            }
            
            // Use requestAnimationFrame for smooth scrolling
            let ticking2 = false;
            function requestTick2() {
                if (!ticking2) {
                    window.requestAnimationFrame(function() {
                        onScroll2();
                        ticking2 = false;
                    });
                    ticking2 = true;
                }
            }
            
            $(window).on('scroll', requestTick2);
            $(window).on('resize', requestTick2);
            onScroll2(); // Initial call
            scrollHandlerAttached2 = true;
        }
        
        // Set up scroll handler immediately
        setupSection2ScrollHandler();
    }

    // Section 4: Skill Demand Changes - Manual scroll handler with lens effect
    const $section4 = $('#section-4');
    
    if ($section4.length > 0) {
        let lastScrollPercent4 = -1;
        let scrollHandlerAttached4 = false;
        
        function setupSection4ScrollHandler() {
            if (scrollHandlerAttached4) return;
            
            const section4 = $section4[0];
            if (!section4) return;
            
            function onScroll4() {
                const rect = section4.getBoundingClientRect();
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
                
                // Initialize visualization if needed
                if (scrollPercent > 0.1 && !skillDemandChangesViz) {
                    createSkillDemandChanges();
                    // Wait a bit for visualization to render before updating lens
                    setTimeout(function() {
                        updateSkillDemandLens(scrollPercent);
                    }, 500);
                } else if (skillDemandChangesViz) {
                    // Update lens if scroll percent changed
                    if (Math.abs(scrollPercent - lastScrollPercent4) > 0.1) {
                        lastScrollPercent4 = scrollPercent;
                        updateSkillDemandLens(scrollPercent);
                    }
                }
            }
            
            // Use requestAnimationFrame for smooth scrolling
            let ticking4 = false;
            function requestTick4() {
                if (!ticking4) {
                    window.requestAnimationFrame(function() {
                        onScroll4();
                        ticking4 = false;
                    });
                    ticking4 = true;
                }
            }
            
            $(window).on('scroll', requestTick4);
            $(window).on('resize', requestTick4);
            onScroll4(); // Initial call
            scrollHandlerAttached4 = true;
        }
        
        // Set up scroll handler immediately
        setupSection4ScrollHandler();
    }

    // Section 5: High AI Opportunity - Manual scroll handler with salary bands to scatter transition
    const $section5 = $('#section-5');
    
    if ($section5.length > 0) {
        let lastScrollPercent5 = -1;
        let scrollHandlerAttached5 = false;
        
        function setupSection5ScrollHandler() {
            if (scrollHandlerAttached5) return;
            
            const section5 = $section5[0];
            if (!section5) return;
            
            function onScroll5() {
                const rect = section5.getBoundingClientRect();
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
                
                // Initialize visualization if needed
                if (scrollPercent > 0.1 && !highAIOpportunityViz) {
                    createHighAIOpportunity();
                    // Wait a bit for visualization to render before updating transition
                    setTimeout(function() {
                        updateHighAIOpportunityTransition(scrollPercent);
                    }, 500);
                } else if (highAIOpportunityViz) {
                    // Update transition if scroll percent changed
                    if (Math.abs(scrollPercent - lastScrollPercent5) > 0.1) {
                        lastScrollPercent5 = scrollPercent;
                        updateHighAIOpportunityTransition(scrollPercent);
                    }
                }
            }
            
            // Use requestAnimationFrame for smooth scrolling
            let ticking5 = false;
            function requestTick5() {
                if (!ticking5) {
                    window.requestAnimationFrame(function() {
                        onScroll5();
                        ticking5 = false;
                    });
                    ticking5 = true;
                }
            }
            
            $(window).on('scroll', requestTick5);
            $(window).on('resize', requestTick5);
            onScroll5(); // Initial call
            scrollHandlerAttached5 = true;
        }
        
        // Set up scroll handler immediately
        setupSection5ScrollHandler();
    }

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
