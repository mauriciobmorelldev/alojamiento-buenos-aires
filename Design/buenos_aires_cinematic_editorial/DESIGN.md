---
name: Buenos Aires Cinematic Editorial
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#20201f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8f9097'
  outline-variant: '#45474c'
  surface-tint: '#bfc6dc'
  primary: '#bfc6dc'
  on-primary: '#293041'
  primary-container: '#101828'
  on-primary-container: '#798195'
  inverse-primary: '#565e71'
  secondary: '#c9c6c2'
  on-secondary: '#31302d'
  secondary-container: '#474743'
  on-secondary-container: '#b7b5b0'
  tertiary: '#e2c19b'
  on-tertiary: '#412d11'
  tertiary-container: '#251500'
  on-tertiary-container: '#997d5a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe2f9'
  primary-fixed-dim: '#bfc6dc'
  on-primary-fixed: '#141b2c'
  on-primary-fixed-variant: '#3f4759'
  secondary-fixed: '#e5e2dd'
  secondary-fixed-dim: '#c9c6c2'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#ffddb6'
  tertiary-fixed-dim: '#e2c19b'
  on-tertiary-fixed: '#291801'
  on-tertiary-fixed-variant: '#594325'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 80px
    fontWeight: '700'
    lineHeight: 92px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  accent-italic:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
spacing:
  margin-desktop: 80px
  margin-mobile: 24px
  gutter: 24px
  section-gap: 160px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built on the concept of "The City as Protagonist." It balances the raw, architectural grit of Buenos Aires with a high-fashion editorial lens. The style is a fusion of **Luxury Minimalism** and **Cinematic High-Contrast**, designed to evoke an emotional, cultured response from a high-net-worth audience seeking more than just property—they are seeking a narrative.

The UI should feel like a premium digital monograph. It prioritizes atmosphere over utility, using expansive imagery, intentional "breathing room," and a strict hierarchy that guides the user through the cultural soul of the city. Every interaction should feel deliberate, smooth, and weighted, mimicking the experience of turning the heavy pages of an expensive art book.

## Colors

The palette is captured from the *Hora Azul* (Blue Hour) in Recoleta. The base is a deep, immersive **Midnight Blue** and **Deep Charcoal**, creating a cinematic stage for content. 

- **Primary & Neutral:** Used for deep backgrounds and container surfaces to ensure the "dark room" effect.
- **Warm Cream & Paper White:** Reserved strictly for typography and fine UI lines to mimic high-end stationery.
- **Subtle Bronze:** Used for interactive highlights and premium indicators.
- **Restrained Wine:** An emotional "punctuation mark," used sparingly for high-value alerts or deep-narrative CTAs.

Avoid pure blacks; use the Midnight Blue (#101828) for the primary canvas to maintain a soft, sophisticated depth.

## Typography

Typography is the primary voice of the brand. We employ a high-contrast serif for a literary feel and a systematic sans-serif for functional clarity.

- **Display & Headlines:** Use **Playfair Display**. For emotional impact, utilize the italic weight to emphasize cultural terms (e.g., *Porteño*).
- **Body:** Use **Inter** with generous line-height (at least 1.6x) to ensure the text feels airy and readable against dark backgrounds.
- **Labels:** Small caps with tracking (0.1em) should be used for metadata and category labels to create an architectural, structured feel.
- **Scale:** Maintain a significant ratio between headlines and body to emphasize the editorial hierarchy.

## Layout & Spacing

The design system utilizes a **12-column Fixed Grid** (max-width 1440px) for desktop to maintain the feel of a printed magazine. 

- **Whitespace as Luxury:** Section gaps are intentionally large (160px+) to allow the eye to rest and to signify the premium nature of the content.
- **Imagery:** Photography should often break the grid, utilizing full-bleed "hero" moments or asymmetric placements that span 8-10 columns.
- **Mobile:** Transition to a 4-column fluid grid with 24px margins. Over-indexing on vertical scrolling allows for large-scale imagery to remain impactful on small screens.

## Elevation & Depth

This system eschews traditional shadows in favor of **Tonal Layering** and **Subtle Outlines**.

- **Surfaces:** Use `#1A1A1A` for the base and `#101828` for elevated "cards" or containers.
- **Outlines:** Use 1px borders in `Subtle Bronze` at 20% opacity or `Muted Stone` at 10% opacity to define boundaries without adding visual clutter.
- **Glassmorphism:** For overlays (like navigation bars or image captions), use a 20px background blur with a 40% opaque `Midnight Blue` fill. This creates a "cinematic lens" effect.

## Shapes

To maintain an architectural and sophisticated aesthetic, the design system utilizes **Sharp (0px)** corners for all primary UI elements (images, buttons, containers). 

Sharp edges convey precision, luxury, and the structural silhouettes of Buenos Aires' historic architecture. Softness should be introduced through photography and typography (the curves of the serif), rather than the UI frame itself.

## Components

### Buttons
Primary buttons are ghost-style: Paper White text, 1px Bronze border, Sharp corners. Hover states should involve a subtle fill of Subtle Bronze (#A68966) with text switching to Midnight Blue.

### Cards (Property & Culture)
Cards are borderless with high-quality, full-bleed imagery. Typography is overlaid using a subtle bottom-to-top dark gradient (0% to 60% opacity). Metadata should use the `label-caps` style in Muted Stone.

### Input Fields
Minimalist under-line inputs. A 1px line in Muted Stone that shifts to Paper White on focus. Labels should be floating or placed above in `label-caps`.

### Cinematic Transitions
All page transitions and component reveals (like property details) should use a slow (400ms-600ms) ease-in-out motion. Imagery should have a slight "Ken Burns" scale effect (1.0 to 1.05) to enhance the cinematic feeling.

### Navigation
A persistent, minimalist top bar with a glassmorphism blur. The logo should be centered, with navigation links in `label-caps` on either side, utilizing a subtle bronze underline for active states.