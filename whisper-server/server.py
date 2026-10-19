"""
Local OpenAI Whisper transcription server.

Uses the open-source package from https://github.com/openai/whisper
(no OpenAI API key). Audio never leaves this machine.

Env:
  WHISPER_MODEL   tiny | base | small | medium | large | turbo  (default: small)
  WHISPER_DEVICE  cpu | cuda  (default: auto)
  WHISPER_HOST    default 127.0.0.1
  WHISPER_PORT    default 8178
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import whisper
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

MODEL_NAME = os.getenv("WHISPER_MODEL", "small").strip() or "small"
DEVICE = os.getenv("WHISPER_DEVICE", "").strip() or None
HOST = os.getenv("WHISPER_HOST", "127.0.0.1")
PORT = int(os.getenv("WHISPER_PORT", "8178"))

_model: Optional[whisper.Whisper] = None
_transcribe_lock = asyncio.Lock()


def get_model() -> whisper.Whisper:
    global _model
    if _model is None:
        load_kwargs = {"device": DEVICE} if DEVICE else {}
        print(f"[whisper] Loading model '{MODEL_NAME}'...")
        _model = whisper.load_model(MODEL_NAME, **load_kwargs)
        print(f"[whisper] Model '{MODEL_NAME}' ready.")
    return _model


def _run_whisper(
    tmp_path: str,
    *,
    language: Optional[str],
    prompt: Optional[str],
    is_final: bool,
) -> dict:
    model = get_model()

    # Keep options simple — heavy beam/best_of/temp fallbacks stall the CPU and
    # make live updates + "stop" appear broken.
    options: dict = {
        "fp16": False,
        "task": "transcribe",
        "temperature": 0,
        "without_timestamps": True,
        "condition_on_previous_text": False,
        "no_speech_threshold": 0.4,
        "compression_ratio_threshold": 2.4,
        "logprob_threshold": -1.0,
    }

    if is_final:
        options["beam_size"] = 3
    else:
        # Greedy decode for live UI
        options["beam_size"] = 1

    if language:
        options["language"] = language
    if prompt:
        options["initial_prompt"] = prompt[:160]

    result = model.transcribe(tmp_path, **options)
    return {
        "text": (result.get("text") or "").strip(),
        "language": result.get("language") or language,
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_model()
    yield


app = FastAPI(title="Local Whisper", version="1.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE or "auto",
        "ready": _model is not None,
    }


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
    finalize: Optional[str] = Form(None),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Audio file is required.")

    suffix = Path(file.filename).suffix or ".webm"
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty audio upload.")

    tmp_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(raw)
            tmp_path = tmp.name

        is_final = (finalize or "").lower() in ("1", "true", "yes")
        lang = (language or "").strip().lower() or None
        prompt_text = (prompt or "").strip() or None

        # Serialize Whisper jobs — parallel CPU jobs make everything slower.
        async with _transcribe_lock:
            result = await asyncio.to_thread(
                _run_whisper,
                tmp_path,
                language=lang,
                prompt=prompt_text,
                is_final=is_final,
            )

        return {
            "text": result["text"],
            "language": result["language"],
            "model": MODEL_NAME,
            "finalize": is_final,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host=HOST, port=PORT, reload=False)
