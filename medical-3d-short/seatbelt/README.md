# Seat Belt Pilot — Production Package

Pilot pertama untuk sub-niche **3D Medical / Anatomical & Safety Simulation**. Status: riset, naskah, voice-over, shot plan, dan preview render selesai; render 3D Remotion belum.

## Isi

| File | Fungsi |
|---|---|
| `VOICEOVER.txt` | Naskah voice-over English, 222 kata |
| `SCRIPT.md` | Naskah lengkap, fakta, sumber, timing, description copy |
| `voice.wav` | Voice-over final, 48 kHz mono, 61.56 detik |
| `voice.mp3` | Sumber MP3 dari TTS |
| `words.json` | 222 word timings, sudah cocok dengan naskah |
| `voice_meta.json` | Metadata voice, rate, pitch, durasi, jumlah kata |
| `tools/make_voice.py` | Script reproduksi TTS + word boundary |
| `tools/render_preview.py` | Renderer preview 2D hemat memori (Pillow + ffmpeg) |
| `remotion/out/seatbelt-preview.mp4` | Preview 1080x1920, 61,56 dtk, sudah mux audio |
| `SHOT_PLAN.md` | 9 shot, timing, kamera, label, sound, catatan anatomi, QA |
| `shot_plan.json` | Data shot plan untuk nanti dipetakan ke `story.ts` |

## Konsep

**The Belt That Buys You Time** — menjelaskan “second collision”, ride-down force, dan kenapa sabuk harus duduk di tulang, bukan jaringan lunak. Visual memakai mannequin dan skeleton transparan, bukan pasien realistis. Tidak ada gore.

## Voice-over

- Voice: `en-US-AndrewNeural`
- Rate: `+15%`, pitch: `-2Hz`
- Durasi: **61.56 detik**
- Format: WAV, 48 kHz, mono, PCM 16-bit
- Level: peak -2.9 dB, mean -20.5 dB
- Word boundary: 222/222 kata cocok, timing monotonik

## Preview render

Preview 2D animatik sudah dirender di VPS 512 MB:

- Output: `remotion/out/seatbelt-preview.mp4`
- Spesifikasi: 1080x1920, 30 fps, 61,56 detik, H.264 + AAC 48 kHz mono
- Contact sheet: `remotion/out/seatbelt-preview-contact.jpg`
- Renderer: `tools/render_preview.py` (Pillow + ffmpeg, tanpa webpack)
- Ukuran file: ~3 MB

Render 3D Remotion masih membutuhkan RAM ≥2 GB.

## Sumber utama

- CDC — seat belts reduce serious crash-related injuries and deaths by about half: https://www.cdc.gov/seat-belts/facts/
- IIHS — effectiveness, ride-down, force distribution, ejection: https://www.iihs.org/topics/seat-belts
- Utah DOT / Click It Utah — proper fit: https://clickit.utah.gov/seat-belts-adults-and-teens/
- WHO — global road traffic context: https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries

## Langkah berikutnya

1. Scaffold project Remotion; sediakan `ffmpeg`/`ffprobe` sistem atau pakai ffmpeg portabel di `.venv`.
2. Buat mannequin dan interior car sederhana; mulai dari shot 1, 5, 6, dan 8 karena paling menentukan gaya.
3. Render stills dulu, review anatomi dan belt path, baru render 2K.
4. QA dengan `short_qa.py`; cek durasi, frame beku, loudness, dan label.
5. Mux audio dengan `-map 0:v:0 -map 1:a:0`; jangan lupa cek bahwa durasi video 1.847 frame = 61,57 detik.

## Disclaimer

Konten edukasi, bukan nasihat medis. Ikuti manual kendaraan dan hukum setempat. Jangan tampilkan korban nyata atau cedera grafis.
