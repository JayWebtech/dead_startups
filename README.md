# ⚰️ Startup Graveyard

> **An immersive 3D memorial for dead startups** — walk through a haunted graveyard of ventures that didn't make it.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-r170-black?logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## 🌙 Overview

Startup Graveyard is a 3D interactive experience built with **Next.js**, **React Three Fiber**, and **Three.js**. Navigate through an eerie graveyard where each tombstone represents a real startup that failed — complete with their founding year, death year, total funding burned, cause of death, and lessons learned.

### ✨ Features

- 🪦 **CSS-styled 3D tombstones** — 5 unique shapes (arch, gothic, cross, obelisk, tablet) with gradients, shadows, and moss overlays
- 🎮 **First-person navigation** — WASD / Arrow keys to walk, mouse drag to look, scroll to zoom
- 🌘 **Atmospheric scene** — stars, moon, dead trees, ghost particles, fog, and lightning flashes
- 📊 **500+ dead startups** from real data with sector, funding, founders, investors, and cause of death
- 🔍 **Click any grave** to open a detailed sidebar with the full story
- 🏷️ **Sector filtering** — filter by industry (Fintech, Health, Ecommerce, etc.)
- ⚡ **Progressive loading** — graves load in batches for smooth performance
- 📱 **Gothic theme** — UnifrakturMaguntia, Crimson Text, and Special Elite fonts

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/JayWebtech/dead_companies.git
cd dead_companies

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start exploring the graveyard.

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 15** | React framework with App Router |
| **React Three Fiber** | React renderer for Three.js |
| **@react-three/drei** | Useful helpers for R3F |
| **Three.js** | 3D rendering engine |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility styling |

## 📁 Project Structure

```
src/app/
├── layout.tsx          # Root layout with gothic fonts & SEO
├── page.tsx            # Main page with UI overlays, tooltips, detail panel
├── GraveyardCanvas.tsx # 3D scene: tombstones, trees, particles, controls
├── globals.css         # Gothic theme, animations, loading screen
dead_startups.json      # Dataset of 500+ dead startups
public/
└── bg.jpg              # Background image
```

## 🎮 Controls

| Input | Action |
|---|---|
| `W` / `↑` | Walk forward |
| `S` / `↓` | Walk backward |
| `A` / `←` | Strafe left |
| `D` / `→` | Strafe right |
| **Mouse drag** | Look around |
| **Scroll** | Zoom in/out |
| **Click grave** | Open startup details |

## 📜 License

MIT

---

*Rest in peace to all the startups that dared to dream.* ⚰️
