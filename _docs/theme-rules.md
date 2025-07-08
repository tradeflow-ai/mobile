# TradeFlow: Theme & Style Guide

## 🎯 Guiding Philosophy
This document is the single source of truth for all visual styling in the TradeFlow application. It provides the design tokens needed to implement the "Warm Professional" aesthetic consistently, using a wooden color palette that reflects the craftsmanship and reliability of the trades industry. All UI components must use these tokens.

---

## 1. Color Palette
Colors are organized by function: Primary (wooden tones) for actions, Neutrals for the interface, Semantics for communicating status, and Secondary colors for variety and accent elements.

### Primary Colors
Used for primary buttons, active states, and key highlights.
- `primary`: `#F4A460` (Sandy Brown - warm, professional wood tone)
- `primary-foreground`: `#FFFFFF` (Text/icons on a primary background)

### Neutral Colors
Used for backgrounds, text, borders, and card surfaces.
- `background`: `#FFFFFF` (Clean white page background)
- `card`: `#F8F9FA` (Light card surface with subtle warmth)
- `card-foreground`: `#000000` (Primary text color)
- `muted-foreground`: `#6C757D` (Secondary/placeholder text color)
- `border`: `#E9ECEF` (Borders for cards and inputs)

### Semantic Colors
Used to provide at-a-glance meaning for UI elements.
- `error`: `#DC3545` (Red for urgent/danger items)
- `warning`: `#FFC107` (Yellow for warnings/in-progress)
- `info`: `#17A2B8` (Teal for informational items)
- `success`: `#28A745` (Green for completed/success states)

### Secondary Colors
Additional colors used for variety and accent elements.
- `secondary`: `#F5DEB3` (Wheat - light wood tone)
- `accent`: `#CD853F` (Peru - medium wood accent)
- `disabled`: `#ADB5BD` (Muted gray for disabled states)

---

## 2. Typography
A clear typographic scale ensures a proper visual hierarchy. We use a standard sans-serif font provided by the operating system.

-   **H1 (Display):** `36px`, `Bold` - For primary screen titles (e.g., "Good morning, Mike")
-   **H2 (Heading):** `24px`, `Bold` - For section titles (e.g., "Today's Schedule")
-   **H3 (Subheading):** `20px`, `Semi-bold` - For card titles
-   **H4 (Subheading):** `16px`, `Semi-bold` - For smaller titles or emphasis
-   **Body:** `16px`, `Regular` - The default for all paragraph and list-item text
-   **Body (Bold):** `16px`, `Bold` - For emphasizing text within body copy
-   **Caption:** `14px`, `Regular` - For secondary information or labels
-   **Button:** `16px`, `Semi-bold` - For all button text

---

## 3. Spacing
An 8px-based scale is used for all margins, padding, and layout spacing to ensure rhythm and consistency.

- `space-xs`: `4px`
- `space-s`: `8px`
- `space-m`: `16px`
- `space-l`: `24px`
- `space-xl`: `32px`
- `space-2xl`: `48px`

---

## 4. Component Tokens
These are specific style values applied to our core UI components.

### Border Radius
- `radius-s`: `8px` (For small elements like tags or badges)
- `radius-m`: `12px` (Default for all cards and inputs)
- `radius-l`: `16px` (For larger containers or bottom sheets)
- `radius-full`: `9999px` (For circular elements like avatars)

### Shadows
Used to create the layered, card-based interface.
- **Subtle Shadow:** (For default cards and inputs)
  - `shadowColor`: `"#000"`
  - `shadowOffset`: `{ width: 0, height: 1 }`
  - `shadowOpacity`: `0.05`
  - `shadowRadius`: `2.00`
  - `elevation`: `1`
- **Medium Shadow:** (For interactive/hovered cards and primary buttons)
  - `shadowColor`: `"#000"`
  - `shadowOffset`: `{ width: 0, height: 4 }`
  - `shadowOpacity`: `0.1`
  - `shadowRadius`: `4.00`
  - `elevation`: `5` 