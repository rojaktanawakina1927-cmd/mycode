# Medical 3D Short — Remotion Scaffold

Project Remotion untuk pilot **The Belt That Buys You Time**. Naskah, voice-over, dan shot plan ada di `../seatbelt/`.

## Status

- `npm run typecheck` — **lulus**
- Audio `voice.wav` (61,56 dtk), `words.json` (222 kata), dan `shot_plan.json` — sudah terhubung
- Browser headless Remotion — sudah terpasang
- Remotion 3D render — **belum berhasil** di VPS ini karena RAM 512 MB
- **Preview video** — sudah dirender lewat fallback Python/Pillow: `out/seatbelt-preview.mp4` (1080x1920, 61,56 dtk)

Bundle 3D mencapai 87% lalu gagal dengan:

```text
FATAL ERROR: Reached heap limit
JavaScript heap out of memory
```

Retry lite dengan heap 384 MB juga tertahan karena swap penuh. Untuk render, gunakan mesin dengan **RAM minimal 2 GB (disarankan 4 GB)**.

## Komposisi

| Entry | Composition | Isi |
|---|---|---|
| `src/index.ts` | `SeatBeltShort` | Scene 3D Three.js/Fiber: mannequin, interior, belt, force arrows |
| `src/lite-entry.ts` | `SeatBeltLite` | Animatik SVG/React tanpa Three.js, untuk preview ringan |

Keduanya memakai `public/voice.wav`, `src/data/words.json`, dan `src/data/shot_plan.json`.

## Command

```sh
cd /root/medical-3d-short/remotion

npm run typecheck
npm run compositions:lite
npm run still:lite
npm run render:lite

# versi 3D
npm run compositions
npm run still
npm run render
```

Jika heap masih kurang, coba:

```sh
NODE_OPTIONS=--max-old-space-size=2048 npm run render:lite
```

## Struktur

```text
remotion/
  public/voice.wav
  src/
    index.ts                 # entry 3D
    Root.tsx                 # komposisi SeatBeltShort
    lite-entry.ts            # entry lite
    LiteRoot.tsx             # komposisi SeatBeltLite
    data/words.json
    data/shot_plan.json
    videos/seatbelt/
      SeatBeltShort.tsx      # komposisi 3D
      SeatBeltLite.tsx       # animatik SVG
      Scene.tsx              # scene Three.js
      Mannequin.tsx
      CameraRig.tsx
      Overlay.tsx            # label anatomi + force meter
      theme.ts
```

## Preview render (low-memory)

Preview animatik 2D bisa dirender tanpa webpack/Three.js:

```sh
cd /root/medical-3d-short
.venv/bin/python seatbelt/tools/render_preview.py --out remotion/out/seatbelt-preview.mp4
```

Hasil: `out/seatbelt-preview.mp4` (1080x1920, 30 fps, 61,56 dtk, audio AAC) dan `out/seatbelt-preview-contact.jpg`. Renderer ini memakai Pillow + ffmpeg dan berhasil di RAM 512 MB.

## Catatan dependency

Instalasi `npm` di VPS ini sempat menghasilkan paket Remotion yang terpotong. Paket inti sudah diperbaiki manual dari tarball resmi. `package-lock.json` yang rusak dipindahkan agar instalasi baru tidak memakai lock yang salah.

Di mesin baru:

```sh
cd remotion
npm install
npx remotion browser ensure
npm run typecheck
```

## Langkah berikutnya

1. Pindahkan project ke mesin/VPS dengan RAM ≥2 GB.
2. Jalankan `npm run still:lite -- --frame=900` untuk cek frame kunci.
3. Review proporsi mannequin, jalur belt, dan label anatomi.
4. Render `SeatBeltLite` sebagai animatik, lalu iterasi ke `SeatBeltShort`.
5. Untuk render final 2K: `npm run render` dengan `--scale 1.3333` setelah komposisi 3D stabil.

## Disclaimer

Konten edukasi, bukan nasihat medis. Gunakan mannequin/animasi, bukan pasien nyata. Jangan tampilkan darah, luka terbuka, atau korban crash nyata.
