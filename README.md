# BharatTrade Frontend

React + Vite responsive trading dashboard. Includes a market-watch UI, search, connection status, portfolio/order placeholders, and clear demo-data labeling.

## Run locally
1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL` to your backend API, e.g. `http://localhost:5000/api`.
3. Run `npm install`, then `npm run dev`.

## Deploy to Vercel
- Import this folder/repository as a Vite project.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` to your deployed backend URL ending in `/api`.

## Important
The UI intentionally does not place live orders. Connect and validate a supported broker adapter on the backend first. Prices shown when no provider is connected are clearly marked illustrative/demo data, not real-time quotes.
