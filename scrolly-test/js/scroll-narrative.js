// Scroll-Watcher Integration for Narrative Visualizations

// Wait for DOM and visualizations to be ready
$(document).ready(function() {
    // Wait for visualizations to initialize
    setTimeout(initScrollNarrative, 1000);
});

function initScrollNarrative() {
    console.log('Initializing scroll narrative...');
    
    // Section 1: Industry Outlook
    const section1Watcher = scrollWatcher({
        parent: '#section-1',
        onUpdate: function(scrollPercent, parentElement) {
            console.log('Section 1 scroll:', scrollPercent);
            // Update visualization based on scroll percentage
            if (scrollPercent < 0.33) {
                // Show only Overall
                updateIndustryOutlook('overall');
            } else if (scrollPercent < 0.66) {
                // Show all functions
                updateIndustryOutlook('all');
            } else {
                // Show only IT
                updateIndustryOutlook('it');
            }

            // Update text content
            const textSection = getTextSectionForScroll(1, scrollPercent);
            if (textSection) {
                updateText(textSection);
            }
        }
    });

    // Section 2: Bubble to Scatter
    const section2Watcher = scrollWatcher({
        parent: '#section-2',
        onUpdate: function(scrollPercent, parentElement) {
            console.log('Section 2 scroll:', scrollPercent);
            // Update visualization based on scroll percentage
            updateBubbleScatter(scrollPercent);

            // Update text content
            const textSection = getTextSectionForScroll(2, scrollPercent);
            if (textSection) {
                updateText(textSection);
            }
        }
    });

    // Initialize text content
    updateText('section-1-overall');
    
    console.log('Scroll narrative initialized');
}

