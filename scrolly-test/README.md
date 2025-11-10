# Scroll-Driven Narrative Visualization

A scroll-driven data visualization narrative exploring AI's impact on the job market, built with D3.js and the scroll-watcher library.

## Overview

This project implements a two-column scroll-driven narrative where visualizations update dynamically as the user scrolls. The left column (75% width) contains interactive visualizations, while the right column (25% width) displays contextual text that updates based on scroll position.

## Project Structure

```
scrolly-test/
├── index.html                 # Main HTML file with two-column layout
├── css/
│   └── styles.css            # Styling for layout and typography
├── js/
│   ├── d3.v7.min.js          # D3.js library (v7)
│   ├── scroll-watcher.js     # Scroll-watcher library for scroll-driven graphics
│   ├── industry-outlook-scroll.js    # Industry outlook visualization with filtering
│   ├── bubble-scatter-scroll.js      # Bubble-to-scatter morph visualization
│   ├── scroll-text.js                # Dynamic text content management
│   └── scroll-narrative.js          # Main orchestrator for scroll-driven narrative
├── data/
│   └── Data/
│       ├── fig_4.4.12.csv    # Industry outlook data
│       └── fig_4.2.25.csv    # Job vulnerability data
└── README.md                 # This file
```

## Key Features

### 1. Industry Outlook Visualization (`industry-outlook-scroll.js`)

A horizontal stacked bar chart showing expected workforce changes by function. The visualization filters dynamically based on scroll position:

- **0-33% scroll**: Shows only "Overall" function
- **33-66% scroll**: Shows all functions, sorted by positivity score
- **66-100% scroll**: Shows only "IT" function

**Features:**
- Color-coded stacked bars (green for increases, red for decreases, gray for neutral)
- Two-row legend centered under the chart
- Smooth transitions between filter states
- Data caching to prevent unnecessary reloads

### 2. Bubble-to-Scatter Morph Visualization (`bubble-scatter-scroll.js`)

A dual-mode visualization that starts as a force-directed bubble chart and morphs into a scatter plot:

- **0-50% scroll**: Bubbles appear progressively, sized by risk score
- **50-100% scroll**: Bubbles smoothly morph into scatter plot positions (risk score vs. salary)

**Features:**
- Force-directed layout for bubble positioning
- Top 5 largest bubbles show labels (fade out during morph)
- Smooth interpolation between bubble and scatter positions
- Grid lines and axes fade in during scatter phase
- Progressive appearance animation

### 3. Dynamic Text Content (`scroll-text.js`)

Manages text content that updates based on scroll position:

- **Section 1**: Three text states matching the industry outlook filters
- **Section 2**: Two text states matching bubble and scatter phases

### 4. Scroll Integration (`scroll-narrative.js`)

Orchestrates the entire scroll-driven narrative:

- Initializes scroll-watcher instances for each section
- Coordinates visualization updates with text updates
- Handles timing and initialization order

## Technical Implementation

### Dependencies

- **D3.js v7**: Data visualization library
- **jQuery**: Required by scroll-watcher library
- **jQuery Fixto**: Required by scroll-watcher for sticky positioning
- **scroll-watcher**: Library for creating scroll-driven graphics (WSJ)

### Scroll-Watcher Integration

The scroll-watcher library monitors scroll position within designated parent elements and calls update functions with a scroll percentage (0-100). Each section has its own scroll-watcher instance:

```javascript
const sectionWatcher = scrollWatcher({
    parent: '#section-1',
    onUpdate: function(scrollPercent, parentElement) {
        // Update visualization based on scrollPercent
    }
});
```

### Animation Approach

- **Transitions**: Uses D3 transitions with `.interrupt()` to prevent conflicts
- **Easing**: Cubic easing functions for smooth animations
- **Duration**: 300ms transitions for responsive feel
- **Per-element updates**: Uses `.each()` for individual element control

### Force Simulation

The bubble chart uses D3's force simulation to position bubbles:
- Collision detection prevents overlap
- Centering forces keep bubbles grouped
- Simulation runs for 2 seconds then stops to save performance
- Final positions stored for morph animation

### Data Loading

- Industry outlook data is cached after first load
- Both visualizations load CSV data using D3.csv
- Error handling for missing data files

## Styling

- **Color Scheme**: Navy (#2c3e50) for text, dark green (#2d5016) for data points
- **Typography**: Merriweather serif font throughout
- **Layout**: Flexbox two-column layout with sticky positioning
- **Background**: Beige (#F0EEE6) for warm, readable aesthetic

## Browser Compatibility

Requires modern browsers with support for:
- ES6 JavaScript features
- CSS Flexbox
- SVG rendering
- jQuery

## Future Enhancements

Potential improvements for future iterations:
- Add more scroll sections
- Implement tooltips on hover
- Add loading states
- Optimize performance for large datasets
- Add mobile responsiveness
- Implement smooth scrolling behavior
- Add transition timing controls

## Usage

Simply open `index.html` in a web browser. The visualizations will initialize automatically and respond to scroll events. Ensure all dependencies are loaded (jQuery, D3, scroll-watcher) and data files are accessible.

## Notes

- The scroll sections have fixed heights (4000px) to provide sufficient scroll distance
- Visualizations are sticky-positioned to remain visible during scroll
- Text content updates dynamically but maintains scroll position
- All animations are optimized for 60fps performance

