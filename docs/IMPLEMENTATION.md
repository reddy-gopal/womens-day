# Women's Day Cards — Implementation Documentation

This document describes the current implementation of the **Women's Day Cards** web app: a React + Vite app where users select greeting cards and can save or share them (e.g. to WhatsApp Status).

---

## 1. Project Overview

| Item | Description |
|------|-------------|
| **Name** | `womens` |
| **Stack** | React 19, Vite 7, ES modules |
| **Purpose** | Browse Women's Day cards, select multiple, capture as images, save or share via Web Share API (e.g. WhatsApp) |

---

## 2. Folder & File Structure

```
womens/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── buttons/
│   │   │   └── ShareHandler.js      # Canvas capture + share/save logic
│   │   ├── CardGrid.jsx             # Grid of cards
│   │   ├── CardItem.jsx             # Single card + selection UI
│   │   └── SelectedBar.jsx         # Bottom bar: count, Clear, Save, Share
│   ├── data/
│   │   └── cards.js                 # Static card definitions
│   ├── App.jsx                      # Root: state + layout
│   ├── App.css
│   ├── index.css
│   └── main.jsx                     # Entry: React root
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

---

## 3. Tech Stack & Scripts

- **React** 19.2, **react-dom** 19.2
- **Vite** 7.3 with **@vitejs/plugin-react**
- **html2canvas** 1.4 — used to capture each card DOM node as an image
- **ESLint** 9 with `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

**Scripts:**

- `npm run dev` — start dev server (Vite)
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

---

## 4. Data Model

### Card object (`src/data/cards.js`)

Each card has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique ID |
| `title` | string | Card title (e.g. "She Believed She Could") |
| `category` | string | Tag: "Inspiration", "Journey", "Resilience", "Wishes" |
| `quote` | string | Main quote text |
| `bg` | string | Background color (hex) |
| `accent` | string | Accent color (hex) for border, tag, title |

There are **8 cards** defined; the list is exported as default from `cards.js`.

### Selection state (in `App.jsx`)

- **`selectedCards`**: array of `{ card, ref }`
  - `card`: full card object
  - `ref`: React ref to the card’s DOM node (used for `html2canvas`)
- Order in the array = order selected = order used for Save/Share.

---

## 5. Component Hierarchy & Data Flow

```
main.jsx
  └── App.jsx
        ├── state: selectedCards, setSelectedCards
        ├── handlers: handleToggle(card, ref), handleClearAll()
        ├── <header> (title + subtitle)
        ├── <main>
        │     └── CardGrid
        │           props: cards, selectedCards, onToggle
        │           └── CardItem (per card)
        │                 props: card, isSelected, selectionOrder, onToggle
        │                 ref on card div → passed to onToggle
        └── SelectedBar
              props: selectedCards, onClearAll
              uses: ShareHandler (cardToBlob, shareToWhatsApp, saveAllCards)
```

- **App** owns `selectedCards` and passes `onToggle` so each **CardItem** can add/remove itself (and its ref) from the selection.
- **SelectedBar** uses refs from `selectedCards` to capture images and then calls **ShareHandler** to save or share.

---

## 6. Components (Detailed)

### 6.1 `App.jsx`

- **Role:** Root component; holds selection state and layout.
- **State:** `selectedCards` — array of `{ card, ref }`.
- **Handlers:**
  - `handleToggle(card, ref)`: if card is already selected, remove it; otherwise append `{ card, ref }`. Order is selection order.
  - `handleClearAll()`: set `selectedCards` to `[]`.
- **Layout:**
  - Light pink background (`#fdf6f8`), header with “Women's Day Cards” and “Select cards to share as WhatsApp Status”.
  - Main area: `CardGrid`; bottom padding increases when the bar is visible (`90px` when `selectedCards.length > 0`).
  - `SelectedBar` fixed at bottom when there is at least one selection.

---

### 6.2 `CardGrid.jsx`

- **Props:** `cards`, `selectedCards`, `onToggle`.
- **Role:** Renders all cards in a responsive grid.
- **Helpers:**
  - `getSelectionOrder(cardId)`: 1-based index in `selectedCards`, or `null` if not selected.
  - `isSelected(cardId)`: whether the card is in `selectedCards`.
- **Layout:** CSS Grid, `repeat(auto-fill, minmax(280px, 1fr))`, gap 16px, padding 16px.
- Renders one **CardItem** per card with `card`, `isSelected`, `selectionOrder`, `onToggle`.

---

### 6.3 `CardItem.jsx`

- **Props:** `card`, `isSelected`, `selectionOrder`, `onToggle`.
- **Ref:** `cardRef` attached to the inner card div (the one that gets captured).
- **Click:** calls `onToggle(card, cardRef)`.
- **Card UI:**
  - Background `card.bg`, border and shadow reflect selection (accent color, scale 0.97 when selected).
  - Category pill (uppercase, small) with `card.accent`.
  - Quote in italics, then title with “— {title}”.
- **Selection badge:** when `isSelected`, a circular badge (top-right) shows `selectionOrder` (1, 2, 3…).

---

### 6.4 `SelectedBar.jsx`

- **Props:** `selectedCards`, `onClearAll`.
- **State:** `isLoading`, `loadingAction` ('save' | 'share') for button feedback.
- **When:** Renders only if `selectedCards.length > 0`; fixed at bottom, white bar with shadow.
- **Left:** Badge with count, “card(s) selected” text, “Clear” button calling `onClearAll`.
- **Right:**
  - **Save:** gets blobs in selection order via `getBlobsInOrder()` (uses `ShareHandler.cardToBlob` for each ref), then `saveAllCards(blobs)`.
  - **Share:** same blobs, then `shareToWhatsApp(blobs)`.
- **`getBlobsInOrder()`:** Iterates `selectedCards`, for each `ref.current` calls `cardToBlob(ref.current)`, returns array of image blobs in selection order.
- **Error handling:** Try/catch; on save failure shows alert; share errors logged and alerted (except `AbortError` for user cancel).

---

### 6.5 `ShareHandler.js` (in `components/buttons/`)

Pure helper module (no React). Exports:

| Function | Purpose |
|----------|---------|
| `cardToBlob(cardElement)` | Uses dynamic `import('html2canvas')`, captures `cardElement` with `useCORS: true`, `backgroundColor: null`, `scale: 2`. Returns a Promise of PNG Blob. |
| `shareToWhatsApp(blobs)` | Checks `navigator.share` and `navigator.canShare({ files })`. Converts blobs to `File` objects (`womens-day-card-1.png`, …). Shares with `navigator.share({ files, title, text })`. Alerts if share not supported or on error (ignores `AbortError`). |
| `downloadCard(blob, index)` | Creates object URL, programmatic `<a download>`, triggers download, revokes URL. Filename: `womens-day-card-${index + 1}.png`. |
| `saveAllCards(blobs)` | Calls `downloadCard(blob, index)` for each blob with 300ms stagger to avoid browser blocking multiple downloads. |

---

## 7. Styling

- **App:** Inline styles for layout and theme (pink background, header, main padding).
- **index.css:** Global defaults (font, color-scheme, `#root` centering, base button/link styles). Some legacy Vite template rules (e.g. `.logo`, `.card`) are present but not central to the cards UI.
- **App.css:** Extra utility/legacy (e.g. `.card` padding, `.read-the-docs`). Card visuals are mostly inline in `CardItem` and `SelectedBar`.

---

## 8. Entry & Build

- **index.html:** Root `<div id="root">`, script `src="/src/main.jsx"` (module).
- **main.jsx:** Imports `index.css`, `App.jsx`; `createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)`.
- **vite.config.js:** Only `plugins: [react()]` (no base path or other custom config).

---

## 9. User Flows

1. **Browse:** User sees 8 cards in a grid.
2. **Select:** Tap a card → it’s added to `selectedCards` with its ref; badge shows order. Tap again → removed.
3. **Clear:** “Clear” in the bottom bar clears all selections.
4. **Save:** “Save” captures each selected card (in order) with html2canvas, then triggers multiple PNG downloads (staggered).
5. **Share:** “Share” captures same way, then uses Web Share API with multiple image files; user picks WhatsApp or another target (best on mobile).

---

## 10. Browser / Environment Notes

- **Web Share API:** Required for “Share on WhatsApp”; typically supported on mobile Chrome/Safari; desktop support varies.
- **html2canvas:** Client-side only; capture is of the card DOM node (no selection badge in the image; card styling is from inline styles and card data).
- **ESLint:** Flat config; JS/JSX; React hooks and React Refresh recommended; `no-unused-vars` with ignore for names starting with `[A-Z_]`.

---

## 11. Summary

The app is a single-page React (Vite) app: static card data, local selection state, refs for DOM capture, and a small ShareHandler module for turning cards into PNGs and either downloading them or sharing via the Web Share API. No backend, no routing, no persistence; all logic is in the listed files under `womens/src`.
