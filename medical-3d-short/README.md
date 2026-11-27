# Medical 3D Short — Codespaces Package

Project pilot **The Belt That Buys You Time**: short vertikal 61,56 detik dengan voice-over, shot plan, preview 2D, dan scaffold Remotion 3D.

## Struktur

```text
medical-3d-short/
  .devcontainer/          # setup Codespaces (Node 20 + ffmpeg + Remotion browser)
  seatbelt/               # naskah, voice.wav, words.json, shot plan, preview renderer
  remotion/               # project Remotion 3D + komposisi lite
```

## Buka di Codespaces

1. Upload/unzip folder ini ke repository GitHub, atau buka folder ini sebagai workspace Codespaces.
2. Pilih **Create Codespace** / **Reopen in Container**.
3. Tunggu `postCreateCommand` selesai — ia memasang ffmpeg, `npm install`, dan Chrome Headless Shell.
4. Di terminal Codespaces:

```sh
cd remotion
npm run typecheck
npm run compositions
```

Lalu render still dulu:

```sh
npm run still -- --frame=900
```

Kalau still sudah benar, render video:

```sh
npm run render
# final 2K:
npm run render -- --scale 1.3333
```

Preview 2D yang lebih ringan:

```sh
npm run render:lite
```

## Catatan Codespaces

- Mesin default 2 core / 8 GB cocok untuk menghindari OOM yang terjadi di VPS 512 MB.
- Tidak ada GPU; WebGL Three.js berjalan software, jadi render 3D bisa lambat. Mulai dari still atau `--scale 0.5`.
- Free tier GitHub biasanya 120 core-hours/bulan. Render 2K bisa menguras kuota.
- `postCreateCommand` mengunduh Chrome Headless Shell (~102 MB).
- Jika `npm install` terputus, jalankan ulang di terminal Codespaces.

## Aset

- Voice-over: `seatbelt/voice.wav` (48 kHz mono, 61,56 dtk)
- Word timing: `seatbelt/words.json` (222 kata)
- Shot plan: `seatbelt/shot_plan.json`
- Audio publik Remotion: `remotion/public/voice.wav`

## Disclaimer

Konten edukasi, bukan nasihat medis. Gunakan mannequin/animasi, bukan pasien nyata. Jangan tampilkan darah, luka terbuka, atau korban crash nyata.
