# GBMunch 🍕🌮🧋

> **Alleviating campus food insecurity and boosting student engagement through General Body Meetings and campus meal scheduling.**

GBMunch connects college students facing financial or food insecurity with General Body Meetings (GBMs) offering verified free meals, while seamlessly integrating campus food pantries and dining hall schedules.

---

## 🌟 Why GBMunch Exists
- **Campus Food Insecurity**: Thousands of college students skip meals, yet student organizations routinely spend hundreds of dollars on catered dinners that go partially uneaten.
- **Fractured Information**: Club announcements are buried across dozens of private or ephemeral Instagram stories.
- **The GBMunch Solution**: A single, beautiful, unified feed of verified free-food events with an interactive drag-and-drop weekly meal scheduler (Monday–Sunday).

---

## 🚀 Key Features

1. **Curated Instagram-Style Feed**:
   - 10+ embedded student club General Body Meeting posts featuring free Domino's pizza, street tacos, brown sugar boba, Halal Guys platters, Panera lunches, CAVA bowls, steamed dumplings, Panda Express, and acai bowls.
   - Authentic Instagram cards with likes, comments, verified badges, event flyers, room locations, and dietary tags (Vegetarian, Halal, Vegan, Gluten-Free).

2. **Campus Food Pantry & Dining Schedules**:
   - Real-time operating hours for campus basic needs pantries (free groceries, emergency meals) and dining halls.
   - Quick-add buttons to incorporate pantry restocks and dining slots into the weekly schedule.

3. **Interactive Drag & Drop Weekly Scheduler (Mon–Sun)**:
   - Drag any of the 10+ GBMs or dining resources directly into specific days of the week.
   - Touch-friendly click-to-add buttons for mobile and tablet users.
   - Real-time **Weekly Financial Savings Tracker** (e.g. $70+ saved per week) and meal coverage metrics.
   - Export schedule to clipboard or calendar text.

4. **Pitch Deck & Competitive Analysis**:
   - Built-in slide presentation covering the target student scenario, the GBMunch solution, technical scaling roadmap (computer vision flyer OCR, automated web scraping), and competitive breakdown against **GATHR** (solving GATHR's stale/expired event weakness).

---

## 📡 Live Data Pipeline ($0)

GBMunch mixes three sources in one feed and calendar:

| Source | How | Refresh |
|---|---|---|
| **GatorConnect** (UF's Campus Labs Engage) | Public discovery API, proxied through `/api/gc` (Vite proxy locally, `vercel.json` rewrite in prod). Keeps events tagged "Free Food" or whose description mentions food. | Live on every page load; `public/data/gatorconnect-snapshot.json` is the fallback, refreshed every 6h by `.github/workflows/refresh-gatorconnect.yml`. |
| **Club Instagrams** (151 handles from GatorConnect profiles) | `scripts/snapshot-instagram.mjs` runs Apify's Instagram Post Scraper (free $5/mo credit, capped per run), OCRs flyers with tesseract.js, parses date/time/room/food with `scripts/lib/parse-post.mjs`. | Sun + Wed via `.github/workflows/refresh-instagram.yml` (needs repo secret `APIFY_TOKEN`). |
| **Featured sample posts** | `src/data/gbmPosts.ts`, anchored to their next weekday. | — |

```bash
node scripts/snapshot-gatorconnect.mjs          # refresh GatorConnect fallback
node scripts/instagram-handles.mjs              # rebuild the club handle list
node scripts/snapshot-instagram.mjs --limit 5   # small paid test run (needs APIFY_TOKEN in .env.local)
node scripts/snapshot-instagram.mjs --cached    # re-parse last scrape for $0
```

The **Weekly Scheduler** is a drag-and-drop calendar: GBMs snap to their real day and time wherever you drop them; pantries and dining halls snap to that day's open hours. Export to `.ics` for Google/Apple Calendar.

---

## 📦 Export to GitHub (`GBMunchV2`)

### Option A: Using AI Studio 1-Click Export (Fastest)
1. In the top-right corner of Google AI Studio, click **Settings / Export**.
2. Choose **Export to GitHub**.
3. Enter `GBMunchV2` as the repository name.
4. Confirm to push the repository directly to your GitHub profile.

### Option B: Using Git CLI
```bash
# In your local project directory:
git init
git add .
git commit -m "feat: complete GBMunch V2 campus food scheduler"
git branch -M main

# Add your GitHub repository remote:
git remote add origin https://github.com/<YOUR_USERNAME>/GBMunchV2.git

# Push to main:
git push -u origin main
```

---

## 🚀 Deployment Guide

### Deploying to Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New Project** and select your repository **`GBMunchV2`**.
3. Framework Preset: **Vite** (auto-detected).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**!

### Deploying to Netlify
1. Go to [netlify.com](https://netlify.com) and click **Add new site > Import an existing project**.
2. Select GitHub and choose **`GBMunchV2`**.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Click **Deploy Site**.

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build & verify
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion v12)
