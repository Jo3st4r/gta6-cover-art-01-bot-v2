// Neon Coast Cover Studio — the drawing engine.
//
// A cover is a canvas of any size. A layout cuts it into panels, each panel shows
// one of the loaded photos (up to three) with its own zoom and pan, a sunset grade
// washes over everything, and the caption is stamped in neon on top.

/** The five sunset grades: overlay gradient, glow and accent colours. */
export const GRADES = {
  vice: {
    name: 'Vice Dusk',
    top: 'rgba(255, 60, 120, 0.00)',
    bottom: 'rgba(120, 20, 140, 0.55)',
    glow: '#ff2e88',
    accent: '#ff5ea8',
    scrim: 'rgba(20, 4, 32, 0.85)',
  },
  golden: {
    name: 'Golden Hour',
    top: 'rgba(255, 170, 0, 0.00)',
    bottom: 'rgba(180, 80, 0, 0.50)',
    glow: '#ffb300',
    accent: '#ffd54d',
    scrim: 'rgba(40, 16, 0, 0.85)',
  },
  neon: {
    name: 'Neon Pink',
    top: 'rgba(0, 220, 255, 0.05)',
    bottom: 'rgba(255, 0, 150, 0.55)',
    glow: '#ff2ea6',
    accent: '#00e5ff',
    scrim: 'rgba(24, 2, 32, 0.85)',
  },
  ember: {
    name: 'Ember',
    top: 'rgba(255, 80, 0, 0.00)',
    bottom: 'rgba(140, 0, 0, 0.60)',
    glow: '#ff5722',
    accent: '#ff8a50',
    scrim: 'rgba(32, 4, 0, 0.85)',
  },
  teal: {
    name: 'Teal Dusk',
    top: 'rgba(0, 200, 180, 0.05)',
    bottom: 'rgba(40, 0, 90, 0.55)',
    glow: '#00e5c7',
    accent: '#7c4dff',
    scrim: 'rgba(4, 12, 32, 0.85)',
  },
};

/** The six layouts, in the order the editor offers them. */
export const LAYOUTS = {
  grid9: { name: '9-Panel Grid', panels: 9 },
  grid4: { name: '4-Panel Grid', panels: 4 },
  hero3: { name: 'Hero + 3', panels: 4 },
  tilt: { name: 'Tilted Snapshots', panels: 3 },
  bleed: { name: 'Full Bleed', panels: 1 },
  herostrip: { name: 'Hero + Film Strip', panels: 4 },
};

/** A fresh state: two sample photos in, a caption ready to stamp. */
export function freshState() {
  return {
    layout: 'grid9',
    grade: 'vice',
    caption: 'SUNSET HEIST',
    sub: 'Neon Coast',
    captionFont: 'anton',
    photos: [null, null, null],
    panels: [0, 1, 0, 1, 0, 1, 0, 1, 0],
  };
}

/** The panel rectangles of a layout, as fractions of the canvas. */
export function panelRects(layout, w, h) {
  const gap = Math.max(2, Math.round(Math.min(w, h) * 0.012));
  const cell = (cols, rows, x, y, cw, ch) => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          x: x + c * (cw + gap),
          y: y + r * (ch + gap),
          w: cw,
          h: ch,
        });
      }
    }
    return out;
  };
  switch (layout) {
    case 'grid9': {
      const cw = (w - gap * 2) / 3;
      const ch = (h - gap * 2) / 3;
      return cell(3, 3, 0, 0, cw, ch);
    }
    case 'grid4': {
      const cw = (w - gap) / 2;
      const ch = (h - gap) / 2;
      return cell(2, 2, 0, 0, cw, ch);
    }
    case 'hero3': {
      const heroH = Math.round(h * 0.62);
      const rowH = h - heroH - gap;
      const cw = (w - gap * 2) / 3;
      return [{ x: 0, y: 0, w, h: heroH }, ...cell(3, 1, 0, heroH + gap, cw, rowH)];
    }
    case 'herostrip': {
      const heroH = Math.round(h * 0.72);
      const rowH = h - heroH - gap;
      const cw = (w - gap * 2) / 3;
      return [{ x: 0, y: 0, w, h: heroH }, ...cell(3, 1, 0, heroH + gap, cw, rowH)];
    }
    case 'tilt':
    case 'bleed':
    default:
      return [{ x: 0, y: 0, w, h }];
  }
}

/** Draws one photo to cover a rectangle, honouring its zoom and pan. */
export function drawPhoto(ctx, photo, x, y, w, h) {
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih) * photo.zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const cx = x + w / 2 + photo.ox * Math.max(0, (pw - w) / 2);
  const cy = y + h / 2 + photo.oy * Math.max(0, (ph - h) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** A photo's panels, in order, for the current layout. */
function panelPhotos(state) {
  const count = LAYOUTS[state.layout].panels;
  const slots = state.panels.slice(0, count);
  while (slots.length < count) slots.push(slots.length % 3);
  return slots;
}

/** The tilted polaroid frames of the Tilted Snapshots layout. */
function tiltFrames(w, h) {
  const fw = w * 0.52;
  const fh = h * 0.52;
  return [
    { x: w * 0.06, y: h * 0.08, w: fw, h: fh, rot: -0.1, photo: 0 },
    { x: w * 0.42, y: h * 0.2, w: fw, h: fh, rot: 0.06, photo: 1 },
    { x: w * 0.2, y: h * 0.42, w: fw, h: fh, rot: -0.04, photo: 2 },
  ];
}

/** Fits a font size so `text` spans at most `maxWidth`. */
function fitFont(ctx, text, font, start, maxWidth) {
  let size = start;
  ctx.font = font(size);
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

/** Stamps the caption (and its script sub-caption) over the cover. */
function stampCaption(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const caption = state.caption.trim();
  const sub = state.sub.trim();
  if (!caption && !sub) return;
  const bandY = h * 0.86;
  const scrim = ctx.createLinearGradient(0, h * 0.6, 0, h);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let top = bandY;
  if (sub) {
    const subSize = fitFont(ctx, sub, (s) => `${s}px Pacifico, cursive`, h * 0.055, w * 0.7);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(sub, w / 2, bandY - h * 0.13);
    ctx.shadowBlur = 0;
    top = bandY;
  }
  if (caption) {
    const words = caption.toUpperCase();
    const face = state.captionFont === 'pacifico' ? 'Pacifico, cursive' : 'Anton, sans-serif';
    const size = fitFont(ctx, words, (s) => `${s}px ${face}`, h * 0.11, w * 0.9);
    ctx.font = `${size}px ${face}`;
    // A chromatic echo behind the letters, then the white face with a neon glow.
    ctx.fillStyle = grade.accent;
    ctx.fillText(words, w / 2 + size * 0.03, top + size * 0.03);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.28;
    ctx.fillText(words, w / 2, top);
    ctx.shadowBlur = 0;
  }
}

/** The studio wordmark, top left, letterspaced. */
function stampWordmark(ctx, state, w, h) {
  const grade = GRADES[state.grade];
  const size = Math.max(14, Math.round(h * 0.028));
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  try {
    ctx.letterSpacing = `${Math.round(size * 0.22)}px`;
  } catch {
    // Older canvas builds ignore letter spacing; the mark still reads.
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = size * 0.6;
  ctx.fillText('NEON COAST', w * 0.03, h * 0.03);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` at its own size, from `state`.
 * Photos are `{ img, zoom, ox, oy }` (or null); a missing photo leaves a
 * sun-bleached placeholder panel in its place.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade];
  ctx.fillStyle = '#160a1e';
  ctx.fillRect(0, 0, w, h);
  const loaded = state.photos.filter((p) => p !== null);

  if (state.layout === 'tilt') {
    // A sun-bleached backdrop photo, darkened, then three tilted polaroids.
    const back = state.photos[state.panels[0]] ?? loaded[0] ?? null;
    if (back) {
      drawPhoto(ctx, back, 0, 0, w, h);
      ctx.fillStyle = 'rgba(10, 4, 20, 0.45)';
      ctx.fillRect(0, 0, w, h);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#ff7a3d');
      sky.addColorStop(0.6, '#e83e8c');
      sky.addColorStop(1, '#3b0f54');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
    }
    for (const frame of tiltFrames(w, h)) {
      const slot = state.panels[frame.photo] ?? frame.photo;
      const photo = state.photos[slot] ?? loaded[slot % Math.max(1, loaded.length)] ?? null;
      const pad = Math.round(Math.min(w, h) * 0.02);
      const foot = Math.round(frame.h * 0.14);
      ctx.save();
      ctx.translate(frame.x + frame.w / 2, frame.y + frame.h / 2);
      ctx.rotate(frame.rot);
      ctx.fillStyle = '#fdfbf6';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = Math.round(Math.min(w, h) * 0.03);
      ctx.shadowOffsetY = Math.round(Math.min(w, h) * 0.012);
      ctx.fillRect(-frame.w / 2, -frame.h / 2, frame.w, frame.h);
      ctx.restore();
      ctx.save();
      ctx.translate(frame.x + frame.w / 2, frame.y + frame.h / 2);
      ctx.rotate(frame.rot);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (photo) {
        drawPhoto(ctx, photo, -frame.w / 2 + pad, -frame.h / 2 + pad, frame.w - pad * 2, frame.h - pad * 2 - foot);
      } else {
        ctx.fillStyle = '#f4c95d';
        ctx.fillRect(-frame.w / 2 + pad, -frame.h / 2 + pad, frame.w - pad * 2, frame.h - pad * 2 - foot);
      }
      ctx.fillStyle = '#2b2b2b';
      ctx.font = `${Math.max(12, Math.round(foot * 0.42))}px Pacifico, cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(state.sub.trim() || 'golden hour', 0, frame.h / 2 - foot * 0.28);
      ctx.restore();
    }
  } else {
    const rects = panelRects(state.layout, w, h);
    const slots = panelPhotos(state);
    rects.forEach((rect, i) => {
      const photo = state.photos[slots[i]] ?? null;
      if (photo) {
        drawPhoto(ctx, photo, rect.x, rect.y, rect.w, rect.h);
      } else {
        const glow = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
        glow.addColorStop(0, '#f7b733');
        glow.addColorStop(1, '#e83e8c');
        ctx.fillStyle = glow;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `${Math.max(12, Math.round(Math.min(rect.w, rect.h) * 0.09))}px Anton, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`DROP PHOTO ${slots[i] + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.002));
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
    if (state.layout === 'herostrip') {
      // Sprocket holes along the film strip's top edge.
      const stripY = Math.round(h * 0.72) + Math.max(2, Math.round(Math.min(w, h) * 0.012));
      const hole = Math.max(4, Math.round(w * 0.012));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      for (let x = w * 0.03; x < w * 0.97; x += hole * 2.4) {
        ctx.fillRect(x, stripY + hole * 0.4, hole, hole * 0.7);
      }
    }
  }

  // The sunset grade washes over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  stampWordmark(ctx, state, w, h);
  stampCaption(ctx, state, w, h);
}
