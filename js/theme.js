(function () {
  "use strict";

  const palette = {
    background: "#0a0b14",
    surface: "#121520",
    panel: "#181b2a",
    panelRaised: "#1e2235",
    textPrimary: "#f8f9fc",
    textMuted: "#7b7e87",
    axis: "#7b7e87",
    accent: "#1fb8ff",
    accentSecondary: "#6be2ff",
    positiveLight: "#a6f0ff",
    positive: "#43cbff",
    positiveDark: "#0f99ff",
    negativeLight: "#ff93b6",
    negative: "#ff5c8d",
    negativeDark: "#e02f72",
    neutralLight: "#94a3b8",
    neutralDark: "#4c5672",
    warning: "#facc15",
    border: "rgba(111,168,255,0.18)",
    gridline: "rgba(111,168,255,0.18)",
    tooltipBg: "#121520",
    tooltipBorder: "rgba(255,255,255,0.15)",
    shadow: "0 30px 60px rgba(0,0,0,0.55)"
  };
  palette.divergingPositive = palette.positive;
  palette.divergingNegative = palette.negative;

  const stackPalette = [
    palette.positiveLight,
    palette.positive,
    palette.positiveDark,
    palette.neutralLight,
    palette.neutralDark,
    palette.negativeLight,
    palette.negative,
    palette.negativeDark
  ];

  const categorical = [
    "#8fe8ff",
    "#65d4ff",
    "#43bbff",
    "#1f9bff",
    "#0f7dd6",
    "#6ec6ff",
    "#4eaff5",
    "#2a8fdc",
    "#88c4ff",
    "#5aa7ff"
  ];

  const theme = Object.assign(
    {
      palette,
      stackPalette,
      categoricalPalette: categorical,
      axisLabel: palette.axis,
      gridline: palette.gridline,
      tooltipStyles: {
        background: palette.tooltipBg,
        color: palette.textPrimary,
        border: `1px solid ${palette.tooltipBorder}`,
        boxShadow: palette.shadow
      },
      applyAxisStyles(selection) {
        selection
          .selectAll("text")
          .attr("fill", palette.axis)
          .attr("font-family", "'Stack Sans Notch', serif")
          .attr("font-weight", "300");
        selection.selectAll("line").attr("stroke", palette.gridline);
        selection.selectAll("path").attr("stroke", palette.gridline);
      },
      applyGridStyles(selection) {
        selection
          .selectAll("line")
          .attr("stroke", palette.gridline)
          .attr("stroke-opacity", 0.7);
      },
      styleTooltip(tooltip) {
        tooltip
          .style("background-color", this.tooltipStyles.background)
          .style("color", this.tooltipStyles.color)
          .style("border", this.tooltipStyles.border)
          .style("box-shadow", this.tooltipStyles.boxShadow);
      }
    },
    window.aiVizTheme || {}
  );

  window.aiVizTheme = theme;
})();

