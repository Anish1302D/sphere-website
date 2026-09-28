/**
 * ================================================================
 * SPHERE COMMUNITY — SHARED TAILWIND CONFIGURATION
 * Phase 1 Foundation
 *
 * Source of Truth: Stitch Project 9541495705861329003
 *                  "Sphere Community Website Redesign"
 *
 * HOW TO USE:
 *   Include this file AFTER the Tailwind CDN script on each page:
 *
 *   <script src="https://cdn.tailwindcss.com"></script>
 *   <script src="/js/tailwind-config.js"></script>
 *
 *   This replaces the per-page inline <script id="tailwind-config">
 *   blocks that contained the OLD dark-mode design tokens.
 *
 * DO NOT MODIFY this file without updating STITCH-IMPLEMENTATION-SPEC.md.
 * All values must match the current Stitch project exactly.
 * ================================================================
 */

tailwind.config = {
  // Light mode only — Stitch project uses LIGHT colorMode
  darkMode: "class",

  theme: {
    extend: {

      /* ---------------------------------------------------------
         COLORS
         All extracted from Stitch Tailwind config (all pages share
         the identical token set).
      --------------------------------------------------------- */
      colors: {
        // --- Surface Layers ---
        "background":                 "#f8f9ff",
        "surface":                    "#f8f9ff",
        "surface-bright":             "#f8f9ff",
        "surface-dim":                "#cadbf7",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#eff3ff",
        "surface-container":          "#e6eeff",
        "surface-container-high":     "#dde9ff",
        "surface-container-highest":  "#d3e3ff",
        "surface-variant":            "#d3e3ff",
        "surface-tint":               "#4e5e82",

        // --- Text / On-surface ---
        "on-surface":          "#0b1c31",
        "on-surface-variant":  "#44474e",
        "on-background":       "#0b1c31",

        // --- Primary (Black / Deep Navy) ---
        "primary":                  "#000000",
        "on-primary":               "#ffffff",
        "primary-container":        "#081b3b",
        "on-primary-container":     "#7484a9",
        "primary-fixed":            "#d8e2ff",
        "primary-fixed-dim":        "#b6c6ef",
        "on-primary-fixed":         "#081b3b",
        "on-primary-fixed-variant": "#364669",

        // --- Secondary (Royal Blue / Electric Blue) ---
        "secondary":                    "#0044cc",
        "on-secondary":                 "#ffffff",
        "secondary-container":          "#115afe",
        "on-secondary-container":       "#e9ebff",
        "secondary-fixed":              "#dce1ff",
        "secondary-fixed-dim":          "#b6c4ff",
        "on-secondary-fixed":           "#001550",
        "on-secondary-fixed-variant":   "#003ab2",

        // --- Tertiary ---
        "tertiary":                    "#000000",
        "on-tertiary":                 "#ffffff",
        "tertiary-container":          "#001944",
        "on-tertiary-container":       "#377ffc",
        "tertiary-fixed":              "#d9e2ff",
        "tertiary-fixed-dim":          "#afc6ff",
        "on-tertiary-fixed":           "#001944",
        "on-tertiary-fixed-variant":   "#004299",

        // --- Error ---
        "error":              "#ba1a1a",
        "on-error":           "#ffffff",
        "error-container":    "#ffdad6",
        "on-error-container": "#93000a",

        // --- Inverse ---
        "inverse-surface":     "#213147",
        "inverse-on-surface":  "#ebf1ff",
        "inverse-primary":     "#b6c6ef",

        // --- Outline / Border ---
        "outline":         "#75777f",
        "outline-variant": "#c5c6cf",
      },

      /* ---------------------------------------------------------
         BORDER RADIUS
         Exact values from Stitch borderRadius config
      --------------------------------------------------------- */
      borderRadius: {
        "DEFAULT": "0.25rem",   /*  4px */
        "lg":      "0.5rem",    /*  8px */
        "xl":      "0.75rem",   /* 12px */
        "full":    "9999px",    /* pill */
        /* Note: rounded-2xl (1rem / 16px) used in HTML comes from
           Tailwind's built-in scale — not overridden */
      },

      /* ---------------------------------------------------------
         SPACING
         Exact values from Stitch spacing config
      --------------------------------------------------------- */
      spacing: {
        "space-xs":   "0.25rem",   /*  4px */
        "space-sm":   "0.5rem",    /*  8px */
        "space-md":   "1rem",      /* 16px */
        "space-lg":   "1.5rem",    /* 24px */
        "space-xl":   "2.5rem",    /* 40px */
        "space-2xl":  "4rem",      /* 64px */
        "gutter-sm":  "1rem",      /* 16px */
        "gutter":     "1.5rem",    /* 24px */
        "gutter-lg":  "2rem",      /* 32px */
        "margin-sm":  "1rem",      /* 16px */
        "margin":     "2rem",      /* 32px */
        "margin-lg":  "4rem",      /* 64px */
      },

      /* ---------------------------------------------------------
         FONT FAMILIES
         Three-tier hierarchy as specified in Stitch
      --------------------------------------------------------- */
      fontFamily: {
        // Display / Heading tier — Space Grotesk
        "display-hero":        ["Space Grotesk", "sans-serif"],
        "display-hero-mobile": ["Space Grotesk", "sans-serif"],
        "headline-lg":         ["Space Grotesk", "sans-serif"],
        "headline-lg-mobile":  ["Space Grotesk", "sans-serif"],
        "headline-md":         ["Space Grotesk", "sans-serif"],
        "headline-sm":         ["Space Grotesk", "sans-serif"],
        "title-caps":          ["Space Grotesk", "sans-serif"],

        // Body / Narrative tier — Inter
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],

        // Telemetry / Label tier — JetBrains Mono
        "telemetry-code": ["JetBrains Mono", "monospace"],
        "label-caps":     ["JetBrains Mono", "monospace"],
      },

      /* ---------------------------------------------------------
         FONT SIZES
         Exact values from Stitch fontSize config
         Format: [size, { lineHeight, letterSpacing, fontWeight }]
      --------------------------------------------------------- */
      fontSize: {
        "display-hero": [
          "56px",
          { lineHeight: "64px", letterSpacing: "0.08em", fontWeight: "700" }
        ],
        "display-hero-mobile": [
          "36px",
          { lineHeight: "44px", letterSpacing: "0.06em", fontWeight: "700" }
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "0.05em", fontWeight: "600" }
        ],
        "headline-lg-mobile": [
          "26px",
          { lineHeight: "32px", letterSpacing: "0.04em", fontWeight: "600" }
        ],
        "headline-md": [
          "22px",
          { lineHeight: "28px", letterSpacing: "0.04em", fontWeight: "600" }
        ],
        "headline-sm": [
          "18px",
          { lineHeight: "24px", letterSpacing: "0.03em", fontWeight: "600" }
        ],
        "title-caps": [
          "13px",
          { lineHeight: "18px", letterSpacing: "0.22em", fontWeight: "700" }
        ],
        "body-lg": [
          "16px",
          { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "400" }
        ],
        "body-md": [
          "14px",
          { lineHeight: "22px", letterSpacing: "0em", fontWeight: "400" }
        ],
        "body-sm": [
          "12px",
          { lineHeight: "18px", letterSpacing: "0.01em", fontWeight: "400" }
        ],
        "telemetry-code": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }
        ],
        "label-caps": [
          "11px",
          { lineHeight: "14px", letterSpacing: "0.14em", fontWeight: "600" }
        ],
      },

    }
  }
};
