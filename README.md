# MotorMind + DriveLogic Widget (Next.js)

This repo is a **working widget** you can deploy (Vercel recommended) and then embed into LandingSite AI using an iframe.

## What’s included
- **/drivelogic**: Payment-first search UI using extracted smart math from `src/lib/drivelogicSmart.ts`
- **SmartProtect modal**: GAP + VSC options + estimated **monthly deltas** using `src/lib/smartProtect.ts`
- Minimal example inventory at `public/data/inventory.json` (replace with yours)

## Quick start (local)
1. Install Node 18+
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open: http://localhost:3000/drivelogic

## Deploy (Vercel)
1. Push this folder to GitHub
2. Import into Vercel
3. Deploy

## Embedding into LandingSite AI
### Option A (simple iframe)
Paste an iframe in your LandingSite AI “Motormind AI Chat Embed code” area:
```html
<iframe
  src="https://YOUR-DEPLOYED-URL.vercel.app/drivelogic"
  style="width:100%;height:900px;border:0;border-radius:16px;overflow:hidden;"
  loading="lazy"
></iframe>
```

### Option B (embed script)
1. Put this on your page:
```html
<div id="motormind-widget" data-src="https://YOUR-DEPLOYED-URL.vercel.app/drivelogic"></div>
<script src="https://YOUR-DEPLOYED-URL.vercel.app/motormind-widget.js" defer></script>
```
2. The script injects a responsive iframe.

## Swap in your real inventory
Replace `public/data/inventory.json` with your actual inventory export.
- Keep fields consistent with your JSON schema.
- If you don’t have `lat/lon`, the code will fall back to Sterling, CO.

---

### Next step
If you want the “chat” side (MotorMind GPT) inside this same widget, the clean route is:
- Add `/api/chat` that calls OpenAI (server-side) with your `motormindPrompt.ts` and your `intent.ts` logic.
- Build a small chat UI component and render it alongside the payment UI.

