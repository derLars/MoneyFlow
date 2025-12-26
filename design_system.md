# Design System

This document establishes the visual language and implementation guidelines for the Moneyflow user interface, based on the provided "State-of-the-Art" dark mode design.

## 1. Color Palette

The interface uses a high-contrast dark theme with vibrant accents.

### Core Colors
| Token | Hex Value | Tailwind Class | Usage |
|-------|-----------|----------------|-------|
| **Background** | `#0B0E14` | `bg-[#0B0E14]` | Main app background |
| **Surface** | `#151921` | `bg-[#151921]` | Cards, Bottom Navigation, Modals |
| **Primary** | `#3B82F6` | `bg-blue-500` | Primary buttons ("Get Started"), Active states |
| **Accent Gradient** | `#3B82F6` -> `#60A5FA` | `bg-gradient-to-br from-blue-500 to-blue-400` | Hero shapes, Highlights |

### Text Colors
| Token | Hex Value | Tailwind Class | Usage |
|-------|-----------|----------------|-------|
| **Text Primary** | `#FFFFFF` | `text-white` | Headings, Values, Primary Labels |
| **Text Secondary** | `#9CA3AF` | `text-gray-400` | Subtitles, Captions, Inactive Icons |
| **Text Tertiary** | `#6B7280` | `text-gray-500` | Placeholder, subtle details |

### Functional Colors
| Token | Hex Value | Tailwind Class | Usage |
|-------|-----------|----------------|-------|
| **Success** | `#22C55E` | `text-green-500` | Positive trends, Income |
| **Error/Danger** | `#EF4444` | `text-red-500` | Negative trends, Expenses, Delete |
| **Info** | `#60A5FA` | `text-blue-400` | Charts, Active indicators |

---

## 2. Typography

Font Family: **Inter** (sans-serif)

| Role | Size | Weight | Tailwind Classes | Example |
|------|------|--------|------------------|---------|
| **Hero Heading** | 32px | Bold (700) | `text-3xl font-bold` | "The best way to do business" |
| **Value Display** | 36px | Bold (700) | `text-4xl font-bold` | "$69,420" |
| **Section Header** | 12px | SemiBold (600) | `text-xs font-semibold uppercase tracking-widest` | "SUMMARIES", "INCOME" |
| **Body Large** | 16px | Medium (500) | `text-base font-medium` | User greeting, Buttons |
| **Body Regular** | 14px | Regular (400) | `text-sm text-gray-400` | Descriptions, List items |

---

## 3. Spacing & Layout

### Border Radius
- **Cards**: `rounded-3xl` (24px) - Used for content containers, charts, lists.
- **Buttons**: `rounded-xl` (12px) - Used for primary actions.
- **Inputs/Elements**: `rounded-lg` (8px).

### Spacing
- **Screen Padding**: `p-6` (24px) - Standard padding for mobile views.
- **Card Padding**: `p-6` (24px) - Internal spacing for cards.
- **Gap**: `gap-4` (16px) - Standard distance between related elements.
- **Section Gap**: `space-y-6` (24px) - Distance between major sections.

---

## 4. Components

### Buttons
**Primary Button**
- Background: Blue-500 (`#3B82F6`)
- Text: White, SemiBold
- Radius: `rounded-xl`
- Padding: `py-3 px-6`
- Width: Full width on mobile (`w-full`)

### Cards
- Background: Surface (`#151921`)
- Radius: `rounded-3xl`
- Shadow: Subtle or none (flat design)

### Navigation
**Bottom Bar**
- Background: Surface (`#151921`)
- Icons: Outline style (inactive), Solid/Highlighted (active)
- Position: Fixed bottom

**Top Bar**
- Left: Hamburger Menu (`Menu` icon)
- Right: User Avatar (Circle, `rounded-full`, bg-blue-500 or image)

### Charts/Data
- **Line Charts**: Smooth curve (`stroke-width-2`), Gradient fill opacity.
- **Donut Charts**: Thin stroke, Gradient color.
- **Trend Indicators**: Small pill shapes or simple text with `+`/`-` signs.

---

## 5. Implementation Notes (Tailwind)

Ensure `tailwind.config.js` is updated to include these custom colors if they deviate from default palette:

```javascript
// tailwind.config.js snippet
theme: {
  extend: {
    colors: {
      background: '#0B0E14',
      surface: '#151921',
      primary: '#3B82F6',
      secondary: '#9CA3AF',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    borderRadius: {
      '3xl': '1.5rem', // 24px
    }
  }
}
```
