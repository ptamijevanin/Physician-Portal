<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/614b4618-e09c-4cfa-bb06-700bceb3ad1f

## Run Locally

**Prerequisites:** Node.js, and for dictation: Python + ffmpeg (see `whisper-server/README.md`)

1. Install dependencies: `npm install`
2. Optional AI features: set `GEMINI_API_KEY` in `.env.local`
3. Local Whisper dictation (Progress Notes / SOAP):
   - One-time: create `whisper-server/.venv` and `pip install -r whisper-server/requirements.txt`
   - Terminal A: `npm run whisper:server`
   - Terminal B: `npm run dev`
4. App: http://localhost:3000
