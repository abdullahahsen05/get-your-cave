---
name: GETYOURCAVE Design System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#404848'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#717978'
  outline-variant: '#c0c8c8'
  surface-tint: '#3b6566'
  primary: '#002627'
  on-primary: '#ffffff'
  primary-container: '#0f3d3e'
  on-primary-container: '#7da8a8'
  inverse-primary: '#a3cfcf'
  secondary: '#4b6547'
  on-secondary: '#ffffff'
  secondary-container: '#cdebc5'
  on-secondary-container: '#516b4d'
  tertiary: '#21221e'
  on-tertiary: '#ffffff'
  tertiary-container: '#373733'
  on-tertiary-container: '#a1a09a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#beebeb'
  primary-fixed-dim: '#a3cfcf'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#224d4e'
  secondary-fixed: '#cdebc5'
  secondary-fixed-dim: '#b1cfaa'
  on-secondary-fixed: '#092009'
  on-secondary-fixed-variant: '#344d31'
  tertiary-fixed: '#e4e2dc'
  tertiary-fixed-dim: '#c8c6c0'
  on-tertiary-fixed: '#1b1c18'
  on-tertiary-fixed-variant: '#474742'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  h3:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  italic-emphasis:
    fontFamily: Manrope
    fontSize: inherit
    fontWeight: inherit
    lineHeight: inherit
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The visual identity of this design system is rooted in the concept of "Architectural Serenity." It positions the marketplace not just as a utility, but as a premium service for high-value asset protection. By merging the precision of modern fintech with the organic tones of high-end interior design, the UI evokes a sense of security, spatial abundance, and calm.

The design movement is a **Refined Minimalism**. It avoids the frenetic energy of typical startups in favor of generous whitespace, a strictly muted palette, and a focus on structural clarity. This approach builds trust with users looking for a safe "cave" for their belongings, emphasizing stability over speed.

## Colors

The palette is intentionally desaturated to create a sophisticated, environmental atmosphere.

- **Primary (#0F3D3E):** A deep, intellectual forest green used for high-importance actions and brand grounding.
- **Secondary (#A7C4A0):** A muted sage that provides a soft bridge between the dark primary and light backgrounds, used for secondary icons or subtle UI highlights.
- **Background (#F7F7F5):** An off-white that prevents eye strain and feels more premium than pure white.
- **Accent (#F2F0E9):** A cream/beige used for container fills and subtle surface differentiation.
- **Text (#1A1A1A):** A charcoal black that provides high legibility without the harshness of pure black.

Avoid all blue or purple tints in any functional UI elements (e.g., links or status indicators) to maintain the unique forest/earth-inspired identity.

## Typography

**Manrope** is the sole typeface for this design system. Its geometric yet humanist qualities provide a tech-forward look that remains approachable. 

- **Hierarchy:** Use dramatic size differences between display headers and body text to create a clear entry point for the eye.
- **Weight:** Headings should utilize the Bold and ExtraBold weights to feel "anchored."
- **Emphasis:** Use the italic variant sparingly within body text or sub-headers to highlight key marketplace differentiators (e.g., *fully insured* or *climate controlled*).
- **Labels:** Small caps with slight letter spacing should be used for metadata and category tags to differentiate them from functional body copy.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for large screens, centered within the viewport to maintain a sense of order and focus.

- **Grid:** A 12-column grid with 24px gutters. Elements should generally align to the grid, but use generous internal padding (48px+) to prevent the UI from feeling "cramped."
- **Rhythm:** An 8px linear scale governs all spatial relationships. 
- **Density:** This design system prioritizes a "Low Density" layout. Negative space is treated as a first-class citizen to reinforce the premium, "uncluttered" storage metaphor.

## Elevation & Depth

This design system avoids traditional deep shadows in favor of **Tonal Layering** and **Soft Plurality**.

- **Surfaces:** Depth is created by placing Accent (#F2F0E9) containers on the Background (#F7F7F5) canvas. 
- **Shadows:** When necessary for interactivity (like a hovering card), use a single, ultra-soft shadow: `0 4px 20px rgba(15, 61, 62, 0.04)`. The shadow color should be a tinted version of the Primary green, not a neutral grey.
- **Borders:** Use 1px solid borders in a slightly darker shade of the background (#EBEBE8) to define boundaries without adding visual weight.

## Shapes

The shape language is defined by the **Pill** and the **Soft Rectangle**.

- **Pill (Maximum Radius):** Used for all buttons, search bars, and tags. This conveys a modern, approachable fintech feel.
- **Soft Containers:** Large cards or sections should use a `rounded-xl` (1.5rem) radius to soften the layout and contrast with the sharp, geometric typography.
- **Strictness:** Do not use sharp 90-degree corners for any interactive elements.

## Components

- **Buttons:** Primary buttons are full pill-shaped, using the Primary (#0F3D3E) fill with white text. Secondary buttons use a minimal 1px border of the Primary color or a sage green tint.
- **Inputs:** Minimalist approach. Text fields should have a very light #F2F0E9 background and a bottom-border only, or a subtle full-border that darkens on focus.
- **Cards:** Used sparingly. Instead of boxed cards, try using simple dividers or background color shifts (Accent color blocks) to group content. When cards are used, they should have no border and the softest possible shadow.
- **Chips/Tags:** Small pill-shaped elements using the Secondary (#A7C4A0) color at low opacity (10-15%) with dark text for status indicators.
- **Progress Indicators:** Use the Sage green (#A7C4A0) for progress bars or capacity gauges to keep the tone calm and non-urgent.
- **Marketplace Specifics:** Storage "unit" cards should prioritize a large, clean photo with the price and size in a bold Manrope weight, minimizing secondary metadata.