#!/usr/bin/env python3
"""Generate voice.wav + words.json for the seat-belt pilot.

Run inside /root/medical-3d-short:
    .venv/bin/python seatbelt/tools/make_voice.py
"""
from __future__ import annotations

import asyncio
import json
import subprocess
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg

BASE = Path(__file__).resolve().parents[1]
TEXT_PATH = BASE / "VOICEOVER.txt"
MP3_PATH = BASE / "voice.mp3"
WAV_PATH = BASE / "voice.wav"
WORDS_PATH = BASE / "words.json"
META_PATH = BASE / "voice_meta.json"

VOICE = "en-US-AndrewNeural"
RATE = "+15%"
PITCH = "-2Hz"
BOUNDARY = "WordBoundary"


async def synthesize() -> tuple[bytes, list[dict[str, object]]]:
    text = TEXT_PATH.read_text(encoding="utf-8").strip()
    communicate = edge_tts.Communicate(
        text, VOICE, rate=RATE, pitch=PITCH, boundary=BOUNDARY
    )
    audio = bytearray()
    words: list[dict[str, object]] = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            start = chunk["offset"] / 10_000_000
            end = (chunk["offset"] + chunk["duration"]) / 10_000_000
            words.append({
                "word": chunk["text"],
                "start": round(start, 3),
                "end": round(end, 3),
            })
    if not audio:
        raise RuntimeError("TTS returned no audio")
    if not words:
        raise RuntimeError("TTS returned no word boundaries")
    return bytes(audio), words


def to_wav() -> tuple[int, float]:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [
            ffmpeg, "-y",
            "-i", str(MP3_PATH),
            "-ar", "48000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            str(WAV_PATH),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    with wave.open(str(WAV_PATH), "rb") as fh:
        rate = fh.getframerate()
        duration = fh.getnframes() / rate
    return rate, duration


def main() -> None:
    audio, words = asyncio.run(synthesize())
    MP3_PATH.write_bytes(audio)
    WORDS_PATH.write_text(json.dumps(words, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    rate, duration = to_wav()
    meta = {
        "voice": VOICE,
        "rate": RATE,
        "pitch": PITCH,
        "sample_rate": rate,
        "channels": 1,
        "duration": round(duration, 3),
        "words": len(words),
        "source": TEXT_PATH.name,
    }
    META_PATH.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(meta, indent=2))
    if words:
        print("first:", words[0])
        print("last:", words[-1])


if __name__ == "__main__":
    main()
