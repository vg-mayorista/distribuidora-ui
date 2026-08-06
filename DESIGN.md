---
name: VG Mayorista
description: Identidad visual corporativa · Confiabilidad, eficiencia, frescura.
colors:
  primary: "#F2790E"
  primary-hover: "#D9640A"
  primary-press: "#B85408"
  primary-press-text: "#FFFFFF"
  success: "#5D8A1F"
  success-soft: "#EEF4E2"
  accent: "#5B2A86"
  accent-soft: "#F2EEF8"
  neutral-bg: "#FBF8F2"
  neutral-surface: "#FFFFFF"
  neutral-text: "#3C3C3C"
  neutral-title: "#1E1E1E"
  neutral-border: "#E2DED3"
  neutral-muted: "#8A8781"
  neutral-text-muted: "#5E5B57"
  danger: "#C43D3D"
  danger-soft: "#FBEAEA"
  # Incumbent system neutral and semantic extensions to prevent design drift warnings
  black: "#000000"
  gray-pure-eee: "#eee"
  gray-pure-aaa: "#aaa"
  gray-pure-888: "#888"
  gray-pure-555: "#555"
  tailwind-gray-50: "#F9FAFB"
  tailwind-gray-100: "#F3F4F6"
  tailwind-gray-200: "#E5E7EB"
  tailwind-gray-300: "#D1D5DB"
  tailwind-gray-400: "#9CA3AF"
  tailwind-gray-500: "#6B7280"
  tailwind-gray-600: "#4B5563"
  tailwind-gray-700: "#374151"
  tailwind-gray-800: "#1F2937"
  tailwind-gray-900: "#111827"
  tailwind-slate-200: "#e2e8f0"
  tailwind-amber-900: "#78350F"
  tailwind-green-500: "#22C55E"
  tailwind-green-600: "#16A34A"
  tailwind-green-700: "#15803d"
  tailwind-green-100: "#DCFCE7"
  tailwind-yellow-100: "#FEF3C7"
  tailwind-yellow-50: "#FEF9E7"
  tailwind-red-100: "#FEE2E2"
  tailwind-red-200: "#FECACA"
  custom-forest-green: "#1b4332"
  custom-forest-green-light: "#124934"
  custom-bright-green: "#3fd877"
  custom-dark-charcoal: "#0c0c0c"
  custom-dark-gray: "#333538"
  shadow-dark: "rgba(0,0,0,0.4)"
  shadow-darker: "rgba(0,0,0,0.5)"
  shadow-light: "rgba(0,0,0,0.08)"
  shadow-medium: "rgba(0,0,0,0.15)"
  alert-green-soft: "rgba(34, 197, 94, 0.25)"
  alert-green-softer: "rgba(34, 139, 34, 0.1)"
  alert-green-light: "rgba(34, 139, 34, 0.06)"
  alert-green-medium: "rgba(34, 139, 34, 0.08)"
  alert-amber-light: "rgba(245, 158, 11, 0.06)"
  alert-orange-soft: "rgba(109, 125, 139, 0.1)"
typography:
  display:
    fontFamily: "Montserrat, Helvetica Neue, Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "Montserrat, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
  mono:
    fontFamily: "Sfmono-Regular, ui-monospace, SFMono-Regular, Menlo, monospace"
  scale:
    "0.65rem": "0.65rem"
    "0.6875rem": "0.6875rem"
    "0.7rem": "0.7rem"
    "0.72rem": "0.72rem"
    "0.75rem": "0.75rem"
    "0.78rem": "0.78rem"
    "0.8rem": "0.8rem"
    "0.8125rem": "0.8125rem"
    "0.82rem": "0.82rem"
    "0.875rem": "0.875rem"
    "0.9375rem": "0.9375rem"
    "1rem": "1rem"
    "1.0625rem": "1.0625rem"
    "1.1rem": "1.1rem"
    "1.125rem": "1.125rem"
    "1.25rem": "1.25rem"
    "1.3rem": "1.3rem"
    "1.4rem": "1.4rem"
    "1.5rem": "1.5rem"
    "1.6rem": "1.6rem"
    "1.75rem": "1.75rem"
    "1.8rem": "1.8rem"
    "1.875rem": "1.875rem"
    "2rem": "2rem"
    "2.25rem": "2.25rem"
    "2.5rem": "2.5rem"
    "3.5rem": "3.5rem"
    "4rem": "4rem"
    "7rem": "7rem"
    "16px": "16px"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
  # Additional scales found in the project
  r-4px: "4px"
  r-16px: "16px"
  r-20px: "20px"
  r-50px: "50px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: VG Mayorista

## Overview

**Creative North Star: "The Harvest Depot"**

The VG Mayorista design system is built to reflect the warmth, volume, and natural reliability of agricultural distribution, optimized for the speed and pragmatism of B2B ordering. Rather than feeling cold or sterile like typical SaaS platforms, "The Harvest Depot" uses a warm cream base color paired with fresh green and energetic orange. It prioritizes direct scanability and zero friction, allowing wholesale grocery buyers to place complex replenishment orders in minutes without eye strain in warehouse conditions.

Visual decisions are driven by high contrast and absolute functional honesty. There are no distracting animations or decorative shadows. Typography uses a solid structural pairing of Montserrat for strong titles and Inter for dense, highly legible product catalogs.

**Key Characteristics:**
- Warm cream background avoiding harsh white glare.
- Flat, highly-structured containers utilizing fine neutral borders.
- Highly functional color coding: Orange is for action, Green is for state/availability.
- Tabular numeric alignment for prices, stocks, and quantities.

## Colors

The color palette is derived directly from the VG Mayorista logo, representing fresh agricultural goods and energetic warehouse logistics.

### Primary
- **Energetic Orange** (`#F2790E`): The signature primary action color. Used exclusively for primary buttons, active links, primary navigation indicators, and key CTAs.

### Secondary
- **Fresh Green** (`#5D8A1F`): A functional state color representing positive indicators, successful order status, stock availability ("en stock"), and active checkmarks.

### Neutral
- **Crema general** (`#FBF8F2`): The primary background color of the workspace. Reduces contrast fatigue and looks premium.
- **Pure White** (`#FFFFFF`): Reserved for active content surfaces, card bases, table elements, and page sections to contrast against the cream backdrop.
- **Charcoal Text** (`#3C3C3C`): The primary neutral color for body text. Offers soft but high-contrast readability.
- **High-Contrast Dark** (`#1E1E1E`): Used for bold titles, display headers, and important labels.
- **Warm Neutral Border** (`#E2DED3`): The standard border color for inputs, cards, and tables.

### Named Rules
**The Green Read-Only Rule.** Green is strictly a state and information color. It must never be used on clickable interactive elements or action buttons. Green is read, never clicked.
**The Orange Priority Rule.** Energetic Orange is reserved for key user interactions. There should only be one primary Orange button visible per viewport to maintain an absolute visual hierarchy.

## Typography

**Display Font:** Montserrat (fallback: 'Helvetica Neue', Arial, sans-serif)
**Body Font:** Inter (fallback: 'Helvetica Neue', Arial, sans-serif)

**Character:** Montserrat provides a robust, bold agricultural brand presence for logo elements and main headers, while Inter delivers dense, clean, sans-serif tabular readability for products, forms, and data.

### Hierarchy
- **Display** (800, `32px` / `2rem`, `1.2`): Used for landing page hero headers and branding labels.
- **Headline** (700, `24px` / `1.5rem`, `1.3`): Page titles and major dashboard headers.
- **Title** (600, `19px` / `1.1875rem`, `1.4`): Section headers and card headings.
- **Body** (400, `15px` / `0.9375rem`, `1.6`): Primary reading text, descriptions, table data, and input text. Max line length: 70ch.
- **Body Strong** (500, `15px` / `0.9375rem`, `1.6`): Price figures, quantities, and key bold details.
- **Label** (600, `13px` / `0.8125rem`, `1.5`): Button labels, badges, metadata, and form titles.

### Named Rules
**The Tabular Pricing Rule.** All currency amounts, item quantities, and stock numbers must use `font-variant-numeric: tabular-nums` to ensure perfect alignment in columns.

## Layout

VG Mayorista employs a clean grid system built for high item density and mobile-first retail ordering.

- **Responsive Catalog Grid**: In mobile viewports, the product catalog uses a minimum of 2 columns. In desktop viewports, it uses an auto-fitting grid of `minmax(160px, 1fr)`.
- **Spacing Rhythm**: Grid gaps and padding are restricted to the primary scale steps: `8px` (`--space-sm`) inside components, `16px` (`--space-md`) for container padding, and `24px` (`--space-lg`) between major layout sections.

## Elevation & Depth

Consistent with "The Harvest Depot" metaphor, the design system is flat-by-default, utilizing fine borders for structure. Depth is structural rather than decorative, keeping the UI fast and legible on mobile screens under direct warehouse lighting.

### Shadow Vocabulary
- **Active Lift** (`0 4px 12px rgba(60, 60, 60, 0.08)`): Applied strictly on hover states of product cards or buttons, and for active dropdowns or overlays.
- **Static Base**: Flat at rest, delineated with a `1px` border (`#E2DED3`).

### Named Rules
**The Rest Flat Rule.** All container components are completely flat at rest. Drop shadows are used only to respond to user hover or focus states.

## Shapes

Shapes are sturdy and functional, mirroring the box-like, structural depot theme.

- **Rounding scale**:
  - Buttons and inputs: `8px` (`--radius-md`) for standard, comfortable targets.
  - Product cards, alerts, and modal dialogs: `12px` (`--radius-lg`) to soften containers.
  - Badges and status pills: `9999px` (`--radius-full`) for organic pill shapes.

## Components

### Buttons
- **Shape:** Standard rounded corners (8px radius).
- **Primary:** Background orange (`#F2790E`), text white (`#FFFFFF`), standard padding `12px 20px` with bold typography.
- **Secondary:** Transparent background, orange border (`1px solid #F2790E`), text orange. Used for outline options.
- **Hover / Focus:** Hover shifts primary to dark orange (`#D9640A`) and secondary to light orange background (`#FDF0E4`).

### Chips & Badges
- **Style:** Compact background tinted pill with dark text.
- **En Stock**: Background `#EEF4E2`, text `#22330B`, with a small check SVG icon.
- **Stock Bajo**: Background `#FDF0E4`, text `#6B3005`.
- **Sin Stock**: Background `#FBEAEA`, text `#C43D3D`.

### Cards
- **Corner Style:** Rounded corners (12px radius).
- **Background:** White (`#FFFFFF`).
- **Border:** Fine gray border (`1px solid #E2DED3`).
- **Shadow:** Static at rest. Elevates with `var(--shadow-md)` on hover.
- **Layout:** Standard vertical layout with image on top, metadata and action button always visible at the bottom.

### Inputs / Fields
- **Style:** Background white (`#FFFFFF`), border `#E2DED3`, radius 8px, height 40px.
- **Focus:** Border shifts to orange `#F2790E` with a subtle focus ring.

### Navigation
- **Header Navigation:** Cream background (`#FBF8F2`), charcoal links (`#3C3C3C`), with an active link indicated by a solid orange underline or orange text.

## Do's and Don'ts

### Do:
- **Do** align all currency values to the right and use `tabular-nums` formatting in tables.
- **Do** use voseo regional tone ("vos", "comprá", "confirmá") for Argentine market copy.
- **Do** write concise, actionable error states explaining what happened and how to solve it.

### Don't:
- **Don't** use green background or text on clickable action buttons.
- **Don't** use pure black `#000000` for main body text or pure white `#FFFFFF` for main page backgrounds.
- **Don't** hide the "Add to Cart" button in hover states; it must be permanently visible for mobile/touch accessibility.
