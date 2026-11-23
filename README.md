# S. Manohar — Interactive 3D Portfolio & Admin Suite 
(V 1.0.0)

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.169-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

A modern, high-performance 3D developer portfolio and administrative content management suite built with **React 18 + Vite + Three.js + Supabase**. Featuring real-time visitor telemetry, a 3-tier behavioral intrusion detection system, verified multi-page credentials catalog, confidential personal vault, and an 18-tab administration dashboard.

---

## ✨ Features at a Glance

- **3D WebGL Background Canvas**: Interactive geometric Three.js scene with smooth mouse parallax, particle physics, and performance caps for mobile/low-power devices.
- **Hero Intro Video Swapper**: Fluid toggle between high-res portrait photo and intro video inside the same frame.
- **"My Journey" Auto-Adjusting Preview Frames**: Dynamic media cards that naturally adapt to portrait and collage aspect ratios without cropping.
- **Interactive Projects Showcase**: Categorized by Security, AI, Tools, Web, and Mobile with live demo and source code links.
- **Verified Credentials & Certificates Hub (`/certificates`)**:
  - Multi-page document handling for semester marksheets and transcripts.
  - Tagging system (`Medal`, `Awards`, `Digital Badges`, `Other Rewards`, `Certificate`).
  - Multi-criteria sorting (Year, Type Priority, Multi-page first, Title).
  - Exact view-duration tracking and view count analytics.
- **Manohar's Personal Space Vault (`/personal`)**:
  - Secure private sanctuary for confidential milestones, marksheets, and notes.
  - Full in-website document & text previewing system (interactive Google Drive preview iframe, no redirects).
  - In-place text document & note editor (create and modify notes directly on the page).
  - Embedded audio players and video surfaces.
  - Live keyword search and multi-mode sorting.
- **Real-Time Client Telemetry & Analytics**: Non-intrusive logging of visitor OS, browser, screen resolution, viewport, network speed, and live active session duration with a 5-second heartbeat.
- **3-Tier Behavioral Intrusion Detection**:
  - 🟢 **Green (Safe)**: Link clicks, certificate downloads, >20s engagement.
  - 🟡 **Yellow (Warning)**: Admin login screen navigation, F12 developer key inspection.
  - 🔴 **Red (Critical)**: Screenshots (PrintScreen, Win+Shift+S, macOS), screen recording (`getDisplayMedia`), Ctrl+P print, right-click inspect, copy/share tampering.
  - **Super User Filter Rule**: Suppresses false-positive alerts while Manohar manages the portfolio.
- **Role-Based Access Control (RBAC) & Visitor Blocking**:
  - Multi-tier roles (`superuser`, `editor`, `viewer`) with strict permission boundaries.
  - 10-option visitor blocking system with immediate `BlockedScreen` interception.
- **18-Tab Admin Dashboard (`/admin`)**: Complete control over General info, Hero, Sections, Journey, Projects, Skills, Contact, Certificates, Personal Space, Media Library, Themes, Users, and Monitoring.
- **13 Built-in Themes + Custom Theme Engine**: Live font switcher, color pickers, roundness adjustments, and WebGL particle settings.

---

## 🚀 Quick Start

### Option A: Windows Launcher (`portfolio.bat`)
Double-click **`portfolio.bat`** in the project root:
- Press **1**: Starts the site at `http://localhost:5173`.
- Press **2**: Opens the Admin Portal at `http://localhost:5173/admin`.
- Press **3**: Starts on your Wi-Fi network so you can preview on mobile.
- Press **5**: Generates production build and local preview.
- Press **6**: Pushes changes to GitHub for automatic Vercel deployment.

### Option B: Command Line (npm)
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## 🔐 Environment Variables (`.env.local`)

Connect your Supabase PostgreSQL database by creating `.env.local`:
```env
VITE_SUPABASE_URL=https://sqbrczfojykfhfugbisr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl
```

---

## 🧪 Verification Suite
Run the automated end-to-end test suite to verify all 10 public database tables, auth sign-in, and telemetry streamers:
```bash
node scripts/verify_project_flow.cjs
```

---

## 📖 Architecture & Changelog Manual
For deep architectural details, database schemas, and upgrade instructions, see **[`CHANGELOG.md`](./CHANGELOG.md)**.
