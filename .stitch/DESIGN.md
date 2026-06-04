# Design System: Collabdoc

**Project ID:** projects/1401741930672856446

## 1. Visual Theme & Atmosphere

The design system of **Collabdoc** is anchored in a **Corporate/Modern** aesthetic, tailored for a high-velocity collaborative document environment. It prioritizes clarity, focus, and a sense of calm efficiency, allowing user content to lead without visual distraction. The brand voice is professional and authoritative, yet highly approachable, leaning heavily on purposeful whitespace and balanced layouts.

## 2. Color Palette & Roles

- **Vibrant Indigo Accent (#4f46e5):** Used for primary action buttons, hover states, selection overlays, and active indicators.
- **Deep Slate (#131b2e):** Used for primary headings and body text, ensuring maximum readability and contrast.
- **Lavender Tint Background (#faf8ff):** A soft, calming background color that replaces stark white to ease eye strain.
- **Subtle Silver Border (#cbd5e1):** Used for card boundaries, inputs, and section dividers to structure content gracefully.
- **Faint Gray Hover (#f8fafc):** A subtle feedback color for list rows and card hove states.
- **Crimson Red (#ba1a1a):** Reserved strictly for negative call-to-actions, errors, and destructive status messages.

## 3. Typography Rules

The typography utilizes the **Inter** font family exclusively to ensure a systematic, clean presentation.

- **Headlines:** Utilize heavy weights (Semibold and Bold) and tighter letter spacing (`-0.01em` to `-0.02em`) to establish clear hierarchy and presence.
- **Body Text:** Employs medium to light weights with a generous line-height (`1.5x` to `1.6x`) to facilitate comfortable, long-form reading.
- **Labels/Captions:** Smaller scales (12px to 14px) with increased letter spacing (`0.02em` to `0.05em`) and medium weights to preserve clarity.

## 4. Component Stylings

- **Buttons:** Primary buttons feature a solid Indigo (#4f46e5) background, white text, and a base corner radius of 8px (0.5rem). Padding is set to 12px vertical and 24px horizontal.
- **Cards/Containers:** Styled with a pure white (#ffffff) background, a subtle 1px border (#cbd5e1), and 8px (0.5rem) rounded corners. They use a low-contrast ambient shadow to float slightly above the canvas.
- **Inputs/Forms:** Standard text fields have a 1px border (#cbd5e1) and 8px (0.5rem) rounded corners. On focus, the border transitions to active Indigo (#4f46e5) with a soft 2px glow.

## 5. Layout Principles

- **Grid:** Employs a fixed-width 12-column grid for desktop views (maximum width of 1280px) and a fluid grid for mobile views.
- **Margins & Gutters:** Desktop uses 48px outer margins with 24px gutters. Mobile scales to 16px margins and 16px gutters.
- **Section Rhythm:** High vertical spacing (`stack-lg` / 32px) separates distinct blocks, while tighter spacing (`stack-md` / 16px) binds child components.
