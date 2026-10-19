# Local Whisper server

Runs [openai/whisper](https://github.com/openai/whisper) on your machine. No OpenAI API key; audio stays local.

## Prerequisites

- Python 3.9–3.11
- [ffmpeg](https://ffmpeg.org/) on PATH (`choco install ffmpeg` on Windows)
- Enough disk/RAM for the model (`base` ≈ 1 GB)

## Setup

```bash
cd whisper-server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

First run downloads the model weights (cached by Whisper).

## Run

From the project root:

```bash
npm run whisper:server
```

Health check: http://127.0.0.1:8178/health

## Models

Set `WHISPER_MODEL` before starting (`tiny`, `base`, `small`, `medium`, `large`, `turbo`). Default is `base`.

- Accents / accuracy: prefer `small` (or `medium` if you have a GPU)
- Speed on CPU: `tiny` or `base`

```powershell
$env:WHISPER_MODEL="small"
npm run whisper:server
```

Language is auto-detected unless the client sends a `language` form field.