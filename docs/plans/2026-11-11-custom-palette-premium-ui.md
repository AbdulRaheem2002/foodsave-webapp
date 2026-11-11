# Premium Artisan UI Overhaul Implementation Plan (Custom "Foodsave" Palette)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Foodsave from a generic dark/sci-fi template into an authentic, artisanal, human-crafted marketplace adhering strictly to the user's custom design board:
- **Rescued Green (`#2D6A4F`)**: Primary brand identity, "Claim Bag" buttons, active tabs.
- **Earth Leaf (`#4CAF50`)**: Organic freshness, eco impact, verified badges.
- **Surplus Gold (`#FF9800`)**: Urgency pills ("Only 4 left!"), savings bars ("Worth Rs 1500 • Pay Rs 600").
- **Loft Neutral (`#F9F6F0`)**: Warm linen/cream luxury background that eliminates generic neon aesthetics.
- **Dark Ground (`#1F2937`)**: Deep slate for high-readability typography and dark mode depth.

---

## File Structure & Touchpoints

```
src/
├── index.css                                     # [UPDATE] Design tokens, palette variables, organic card shadows, button styles
├── App.tsx                                       # [UPDATE] Theme background binding, luxury hero banner, warm editorial layout
├── components/
│   ├── Navbar.tsx                                # [UPDATE] Rescued Green logo badge, Loft Neutral city pills, Surplus Gold wallet chip
│   ├── Footer.tsx                                # [UPDATE] Dark Ground & Rescued Green footer with clean sustainability stats
│   ├── ConsumerApp/
│   │   ├── DealCard.tsx                          # [UPDATE] Mockup-identical card: "Today's Surplus" pill, "Worth/Pay" bar, "Claim Bag" CTA
│   │   ├── DealFeed.tsx                          # [UPDATE] Warm category filter pills, clean search input, zero-waste empty state
│   │   ├── DealMap.tsx                           # [UPDATE] Cartographic warm map styling, Rescued Green store pins
│   │   ├── ReservationModal.tsx                  # [UPDATE] Boarding-pass voucher styling with JazzCash/EasyPaisa/Wallet tiles
│   │   ├── ActivePassesDrawer.tsx                # [UPDATE] Perforated ticket vouchers with countdown pulses
│   │   ├── ImpactCalculator.tsx                  # [UPDATE] Earth Leaf & Surplus Gold savings telemetry cards
│   │   └── SpinWheelModal.tsx                    # [UPDATE] Palette-matched canvas wheel (Rescued Green, Surplus Gold, Cream)
│   ├── RetailerPOS/
│   │   └── RetailerDashboard.tsx                 # [UPDATE] Clean store dashboard matching palette tokens
│   └── AiCoreSimulator/
│       └── AiCoreSimulator.tsx                   # [UPDATE] Recharts curve line colors matching Rescued Green & Surplus Gold
```

---

## Tasks

- [ ] **Task 1: Core Design System & Tailwind CSS Tokens in `src/index.css`**
  - Register CSS variables for the 5 official palette colors:
    - `--color-rescued-green: #2D6A4F`
    - `--color-earth-leaf: #4CAF50`
    - `--color-surplus-gold: #FF9800`
    - `--color-loft-neutral: #F9F6F0`
    - `--color-dark-ground: #1F2937`
  - Define warm organic card styling (`.artisan-card`, `.loft-panel`, `.badge-gold`, `.btn-claim`).
  - Configure warm cream background with soft paper grain texture for light mode and refined `#1F2937` for dark mode.
  - Verify with `npm run build`.

- [ ] **Task 2: Navbar & Global Navigation Retheming**
  - Update `src/components/Navbar.tsx`:
    - Rescued Green (`#2D6A4F`) brand mark with minimalist leaf/bag logo icon.
    - Loft Neutral city switcher bar with clean active indicators.
    - Surplus Gold (`#FF9800`) Rescue Wallet chip with subtle coin shimmer.
    - Clean typography with zero generic neon gradients.
  - Verify with `npm run build`.

- [ ] **Task 3: Hero Section & Page Frame Overhaul in `src/App.tsx`**
  - Match the "Foodsave Surprise Bag" editorial style from the design board:
    - Heading: "Today's Surplus • Save Food at 70% OFF" in Dark Ground / Rescued Green.
    - Value tags: "100% Halal Verified", "15-Min Hold Codes", "Bykea Express Delivery".
    - "Claim Bag" and "Spin-to-Save" buttons styled with `#2D6A4F` and `#FF9800`.
  - Verify layout responsiveness.

- [ ] **Task 4: DealCard Transformation to Match Exact Board Mockup**
  - Update `src/components/ConsumerApp/DealCard.tsx`:
    - Rounded food image with organic 20px corners.
    - Top badges: "Today's Surplus" pill and "Only X left!" tag in Surplus Gold (`#FF9800`).
    - Store name with verified badge and rating in warm typography.
    - Value proposition badge: **"Worth Rs {original} • Pay Rs {current}"** in Surplus Gold / Loft Neutral.
    - Primary CTA button: **"Claim Bag"** in bold Rescued Green (`#2D6A4F`) with hover lift.
  - Verify card layout in `DealFeed`.

- [ ] **Task 5: DealFeed Filters, Search & Empty State**
  - Update `src/components/ConsumerApp/DealFeed.tsx`:
    - Category pills with clean icons (`🛍️ All Deals`, `🎁 Surprise Bags`, `🥦 Grocery`, `🥐 Bakery`, `🍲 Restaurant`).
    - Search input with Loft Neutral background and Rescued Green border on focus.
    - Artisanal zero-waste empty state illustration with "Reset Filters" action button.
  - Verify filtering interactions.

- [ ] **Task 6: DealMap & Interactive Components Styling**
  - Update `src/components/ConsumerApp/DealMap.tsx`:
    - Shift map aesthetic from sci-fi neon radar to warm organic cartography.
    - Store markers in Rescued Green (`#2D6A4F`) with Surplus Gold selection rings.
  - Retheme `ImpactCalculator.tsx` cards with Earth Leaf (`#4CAF50`) & Surplus Gold (`#FF9800`).
  - Retheme `SpinWheelModal.tsx` wheel wedges using the 5 custom colors.

- [ ] **Task 7: Checkout & Voucher Pass Transformation**
  - Update `src/components/ConsumerApp/ReservationModal.tsx` and `ActivePassesDrawer.tsx`:
    - Perforated ticket voucher aesthetic in Loft Neutral and Rescued Green.
    - Pakistani payment options (JazzCash, EasyPaisa, Cash on Pickup, Rescue Wallet) formatted with brand-consistent badges.
  - Verify checkout flow and passes drawer.

- [ ] **Task 8: End-to-End Verification & Visual Regression Check**
  - Run `npm run lint` and `npm run build`.
  - Verify 0 errors, 0 warnings, and test responsiveness across desktop and mobile viewport sizes.

