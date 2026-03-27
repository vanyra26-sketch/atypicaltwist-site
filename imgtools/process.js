'use strict';
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage, ImageData } = require('canvas');
const faceapi = require('./node_modules/@vladmandic/face-api/dist/face-api.node-wasm.js');
faceapi.env.monkeyPatch({ Canvas: createCanvas, ImageData });

const SRC = path.resolve(__dirname, '../gallery-photos');
const DST = path.resolve(__dirname, '../images/gallery');
const MODEL_DIR = path.resolve(__dirname, './node_modules/@vladmandic/face-api/model');
const MAX_W = 800;
const JPEG_Q = 80;

// ─── Photo manifest ──────────────────────────────────────────────────────────
// crop: fraction to remove from each edge  { top, bottom, left, right }
// horizonRotateDeg: straighten horizon before crop
// blurFaces: run face detection and blur all found faces
// blurMinConf: face detector minimum confidence (default 0.35)
const PHOTOS = [
  // ── Standard resize ────────────────────────────────────────────────────────
  { src: '1000015740.jpg',           dst: 'malaga-city-street.jpg' },
  { src: '1000016298.jpg',           dst: 'malaga-boulevard-statues.jpg' },
  { src: '1000016836.jpg',           dst: 'madrid-bullring.jpg' },
  { src: '1000016873.jpg',           dst: 'madrid-gran-via-night.jpg' },
  { src: '1000016952.jpg',           dst: 'madrid-tapas-bar-night.jpg' },
  { src: '1000017013.jpg',           dst: 'barcelona-gothic-quarter.jpg' },
  { src: '1000017027.jpg',           dst: 'barcelona-casa-beethoven.jpg' },
  { src: '1000026544.webp',          dst: 'nassau-pub-interior.jpg' },
  { src: '1000028881.jpg',           dst: 'at-sea-moonrise.jpg' },
  { src: '1000028882.jpg',           dst: 'malaga-cathedral-crypt.jpg' },
  { src: '1000028883.jpg',           dst: 'at-sea-port-arrival.jpg' },
  { src: '1000028884.jpg',           dst: 'cruise-ship-art-installation.jpg' },
  { src: '20140607_134132.jpg',      dst: 'bermuda-coastal-gardens.jpg' },
  { src: '20140607_134937.jpg',      dst: 'bermuda-pink-sand-beach.jpg' },
  { src: '20211010_112203.jpg',      dst: 'nassau-waterfront.jpg' },
  { src: '20220530_192435.jpg',      dst: 'lisbon-colorful-streets.jpg' },
  { src: '20220603_222210.jpg',      dst: 'paris-seine-night.jpg' },
  { src: '20220607_172940.jpg',      dst: 'florence-arno-river.jpg' },
  { src: '20220607_201939.jpg',      dst: 'florence-duomo-sunset.jpg' },
  { src: '20220610_131030.jpg',      dst: 'caribbean-sailboat.jpg' },
  { src: '20220617_165406_2.jpg',    dst: 'mediterranean-rocky-coast.jpg' },
  { src: '20220618_141333.jpg',      dst: 'sintra-gardens-swan.jpg' },
  { src: '20221022_141335.jpg',      dst: 'bahamas-cruise-ship-lagoon.jpg' },
  { src: '20230605_114427.jpg',      dst: 'st-thomas-magens-bay.jpg' },
  { src: '20240222_123754.jpg',      dst: 'cozumel-garden-mural.jpg' },
  { src: '20240223_140100.jpg',      dst: 'cozumel-mayan-temple.jpg' },
  { src: '20240529_120415.jpg',      dst: 'carnival-horizon-docked.jpg' },
  { src: '20241009_115442.jpg',      dst: 'mykonos-white-blue-house.jpg' },
  { src: '20241010_083132.jpg',      dst: 'kusadasi-harbor.jpg' },
  { src: '20241010_151420.jpg',      dst: 'kusadasi-colorful-market.jpg' },
  { src: '20241011_095843.jpg',      dst: 'santorini-caldera-fira.jpg' },
  { src: '20241011_112855.jpg',      dst: 'santorini-blue-dome-caldera.jpg' },
  { src: '20241011_125536.jpg',      dst: 'santorini-blue-dome-church.jpg' },
  { src: '20241014_123421.jpg',      dst: 'sorrento-baroque-church.jpg' },
  { src: '20241015_091856.jpg',      dst: 'sorrento-bay-panorama.jpg' },
  { src: '20250304_132541.jpg',      dst: 'costa-cruise-ship-tropical.jpg' },
  { src: '20250306_122030.jpg',      dst: 'caribbean-crystal-water-rays.jpg' },
  { src: '20250924_100543.jpg',      dst: 'cadiz-carousel.jpg' },
  { src: 'IMG-20220604-WA0015.jpg',  dst: 'paris-luxury-shops-night.jpg' },
  { src: 'IMG-20220604-WA0020.jpg',  dst: 'paris-seine-institut-night.jpg' },
  { src: 'IMG-20220604-WA0021.jpg',  dst: 'paris-samaritaine-night.jpg' },
  { src: 'IMG-20220618-WA0003.jpg',  dst: 'mediterranean-coast-waves.jpg' },
  { src: 'IMG-20220618-WA0028.jpg',  dst: 'sintra-palace-garden-tower.jpg' },
  { src: 'IMG-20241013-WA0028.jpg',  dst: 'stromboli-volcano.jpg' },
  { src: 'IMG-20241016-WA0196.jpg',  dst: 'santorini-church-wide.jpg' },
  { src: 'IMG-20241019-WA0079.jpg',  dst: 'messina-cathedral-sicily.jpg' },
  { src: 'IMG-20241019-WA0091.jpg',  dst: 'amalfi-coast-boats-bay.jpg' },
  { src: 'IMG_20240223_120707_249.webp', dst: 'roatan-harbor.jpg' },

  // ── Crops ──────────────────────────────────────────────────────────────────
  // Amalfi Coast cliffside: remove stone wall/ledge at bottom
  { src: '20241015_092217.jpg', dst: 'amalfi-coast-cliffside.jpg',
    crop: { bottom: 0.15 } },

  // At-sea sunset pool: level horizon, crop umbrellas at bottom
  { src: 'IMG-20241019-WA0096.jpg', dst: 'at-sea-sunset-pool.jpg',
    horizonRotateDeg: 2, crop: { bottom: 0.22 } },

  // Sorrento coastal cliffs: remove wooden railing/roof at bottom
  { src: '20241015_145433.jpg', dst: 'sorrento-coastal-cliffs.jpg',
    crop: { bottom: 0.10 } },

  // ── Face blur ──────────────────────────────────────────────────────────────
  { src: '1000017018.jpg', dst: 'barcelona-boqueria-candy.jpg',  blurFaces: true },
  { src: '1000017019.jpg', dst: 'barcelona-boqueria-fruit.jpg',  blurFaces: true },
  { src: '1000017017.jpg', dst: 'barcelona-boqueria-jamon.jpg',  blurFaces: true },
  { src: '1000028885.jpg', dst: 'malaga-living-statue.jpg',      blurFaces: true, blurMinConf: 0.25 },
  { src: '20220602_162237.jpg', dst: 'paris-guerlain-boutique.jpg', blurFaces: true },
  { src: 'IMG-20241016-WA0234.jpg', dst: 'kusadasi-folk-dancers.jpg', blurFaces: true },
  { src: 'IMG-20241019-WA0085.jpg', dst: 'athens-acropolis.jpg', blurFaces: true },
  { src: '20220607_190254.jpg', dst: 'florence-carousel.jpg',    blurFaces: true },
  { src: '20241014_120343_2.jpg', dst: 'amalfi-port-street.jpg', blurFaces: true, blurMinConf: 0.25 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resizeAndCrop(srcPath, options) {
  const { crop, horizonRotateDeg } = options;
  let pipeline = sharp(srcPath)
    .rotate();                          // auto-apply EXIF orientation

  if (horizonRotateDeg) {
    pipeline = pipeline.rotate(horizonRotateDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  // Resize to max 800px wide (maintain aspect ratio, no upscale)
  pipeline = pipeline.resize(MAX_W, null, { withoutEnlargement: true });

  if (crop) {
    const meta = await pipeline.clone().toBuffer().then(buf => sharp(buf).metadata());
    const w = meta.width;
    const h = meta.height;
    const left   = Math.round((crop.left   || 0) * w);
    const top    = Math.round((crop.top    || 0) * h);
    const right  = Math.round((crop.right  || 0) * w);
    const bottom = Math.round((crop.bottom || 0) * h);
    const ew = w - left - right;
    const eh = h - top  - bottom;
    pipeline = pipeline.extract({ left, top, width: ew, height: eh });
  }

  return pipeline.toBuffer();
}

async function blurFacesInBuffer(buf, minConf) {
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;

  // Load image into canvas for face-api
  const img = await loadImage(buf);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const tensor = faceapi.tf.browser.fromPixels(
    { data: new Uint8Array(imageData.data), width: w, height: h }
  );

  const detections = await faceapi.detectAllFaces(
    tensor,
    new faceapi.SsdMobilenetv1Options({ minConfidence: minConf || 0.35 })
  );
  tensor.dispose();

  if (!detections.length) {
    console.log('    (no faces detected — image saved as-is)');
    return buf;
  }

  console.log('    ' + detections.length + ' face(s) detected, blurring...');

  // Build composite list: for each face, extract + heavy blur + overlay
  const composites = [];
  const PAD = 0.25; // 25% padding around face box
  for (const det of detections) {
    const b = det.box;
    const x  = Math.max(0, Math.round(b.x - b.width  * PAD));
    const y  = Math.max(0, Math.round(b.y - b.height * PAD));
    const bw = Math.min(w - x, Math.round(b.width  * (1 + 2 * PAD)));
    const bh = Math.min(h - y, Math.round(b.height * (1 + 2 * PAD)));
    if (bw < 2 || bh < 2) continue;

    const blurred = await sharp(buf)
      .extract({ left: x, top: y, width: bw, height: bh })
      .blur(18)
      .toBuffer();
    composites.push({ input: blurred, left: x, top: y });
  }

  return sharp(buf).composite(composites).toBuffer();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(DST, { recursive: true });

  const needsFace = PHOTOS.some(p => p.blurFaces);
  if (needsFace) {
    console.log('Initialising face detector (WASM)...');
    await faceapi.tf.setBackend('wasm');
    await faceapi.tf.ready();
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_DIR);
    console.log('Face detector ready.\n');
  }

  let done = 0;
  for (const photo of PHOTOS) {
    const srcPath = path.join(SRC, photo.src);
    const dstPath = path.join(DST, photo.dst);

    if (!fs.existsSync(srcPath)) {
      console.warn('SKIP (not found):', photo.src);
      continue;
    }

    process.stdout.write(`[${++done}/${PHOTOS.length}] ${photo.src} → ${photo.dst} `);

    try {
      let buf = await resizeAndCrop(srcPath, photo);

      if (photo.blurFaces) {
        buf = await blurFacesInBuffer(buf, photo.blurMinConf);
      } else {
        process.stdout.write('\n');
      }

      await sharp(buf).jpeg({ quality: JPEG_Q, mozjpeg: true }).toFile(dstPath);
    } catch (err) {
      console.error('\n  ERROR:', err.message);
    }
  }

  console.log('\nDone. Output →', DST);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
