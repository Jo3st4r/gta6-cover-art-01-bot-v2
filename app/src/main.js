// Neon Coast Cover Studio — wires the page: photos in, layouts and grades,
// the caption stamped in neon, and the PNG export. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js).
import { drawCover, freshState, GRADES, LAYOUTS, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const state = freshState();

/** The export sizes the studio offers. */
const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};
let sizeKey = 'square';
let selectedSlot = 0;

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Puts an image into a photo slot, resetting its crop. */
function setSlot(slot, img) {
  state.photos[slot] = { img, zoom: 1, ox: 0, oy: 0 };
  selectedSlot = slot;
  syncSlotControls();
}

/** Loads the two sample photos into slots 0 and 1. */
async function loadSamples() {
  try {
    setSlot(0, await loadImage('samples/pier.jpg'));
  } catch {
    // A missing sample leaves an empty slot; the editor still works.
  }
  try {
    setSlot(1, await loadImage('samples/boulevard.jpg'));
  } catch {
    // Same as above.
  }
  selectedSlot = 0;
  syncSlotControls();
}

/** Reflects the selected slot's crop in the sliders. */
function syncSlotControls() {
  const photo = state.photos[selectedSlot];
  document.getElementById('slotLabel').textContent = `Photo ${selectedSlot + 1}`;
  document.getElementById('zoom').value = photo ? photo.zoom : 1;
  document.getElementById('panX').value = photo ? photo.ox : 0;
  document.getElementById('panY').value = photo ? photo.oy : 0;
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('active', i === selectedSlot);
    el.classList.toggle('filled', state.photos[i] !== null);
  });
}

/** Marks the active layout and grade buttons. */
function syncButtons() {
  document.querySelectorAll('[data-layout]').forEach((el) => {
    el.classList.toggle('active', el.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-grade]').forEach((el) => {
    el.classList.toggle('active', el.dataset.grade === state.grade);
  });
  document.querySelectorAll('[data-size]').forEach((el) => {
    el.classList.toggle('active', el.dataset.size === sizeKey);
  });
  document.querySelectorAll('[data-font]').forEach((el) => {
    el.classList.toggle('active', el.dataset.font === state.captionFont);
  });
}

function resizePreview() {
  const size = SIZES[sizeKey];
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
}

document.querySelectorAll('[data-layout]').forEach((el) => {
  el.addEventListener('click', () => {
    state.layout = el.dataset.layout;
    syncButtons();
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((el) => {
  el.addEventListener('click', () => {
    state.grade = el.dataset.grade;
    syncButtons();
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((el) => {
  el.addEventListener('click', () => {
    sizeKey = el.dataset.size;
    syncButtons();
    resizePreview();
  });
});
document.querySelectorAll('[data-font]').forEach((el) => {
  el.addEventListener('click', () => {
    state.captionFont = el.dataset.font;
    syncButtons();
    redraw();
  });
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subInput.addEventListener('input', () => {
  state.sub = subInput.value;
  redraw();
});

document.getElementById('zoom').addEventListener('input', (e) => {
  const photo = state.photos[selectedSlot];
  if (!photo) return;
  photo.zoom = Number(e.target.value);
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  const photo = state.photos[selectedSlot];
  if (!photo) return;
  photo.ox = Number(e.target.value);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  const photo = state.photos[selectedSlot];
  if (!photo) return;
  photo.oy = Number(e.target.value);
  redraw();
});
document.getElementById('resetCrop').addEventListener('click', () => {
  const photo = state.photos[selectedSlot];
  if (!photo) return;
  photo.zoom = 1;
  photo.ox = 0;
  photo.oy = 0;
  syncSlotControls();
  redraw();
});

document.querySelectorAll('.slot input[type=file]').forEach((input, slot) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSlot(slot, await loadImage(URL.createObjectURL(file)));
      status.textContent = `Photo ${slot + 1} loaded.`;
      redraw();
    } catch {
      status.textContent = `Photo ${slot + 1} could not be read.`;
    }
  });
});
document.querySelectorAll('.slot').forEach((el, slot) => {
  el.addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT') {
      selectedSlot = slot;
      syncSlotControls();
    }
  });
});

/** Clicking a panel cycles which photo it shows. */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  if (hit < 0) return;
  const count = LAYOUTS[state.layout].panels;
  const idx = Math.min(hit, count - 1);
  state.panels[idx] = (state.panels[idx] + 1) % 3;
  redraw();
});

/** Dragging photos onto the cover drops them into the first free slot. */
const dropZone = document.getElementById('dropZone');
['dragover', 'dragenter'].forEach((name) => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.add('over');
  });
});
['dragleave', 'drop'].forEach((name) => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.remove('over');
  });
});
dropZone.addEventListener('drop', async (e) => {
  const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
  for (const file of files.slice(0, 3)) {
    const slot = state.photos.findIndex((p) => p === null);
    if (slot < 0) break;
    try {
      setSlot(slot, await loadImage(URL.createObjectURL(file)));
    } catch {
      // A file that cannot be read is skipped.
    }
  }
  status.textContent = 'Photos dropped in.';
  redraw();
});

/** Exports the cover at the chosen size as a PNG download. */
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  if (shot === 'cover') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  runShot(
    shot,
    params,
    async (query) => {
      state.layout = query.get('layout') ?? 'grid9';
      state.grade = query.get('grade') ?? 'vice';
      state.caption = query.get('caption') ?? 'Sunset Heist';
      state.sub = query.get('sub') ?? 'Neon Coast';
      captionInput.value = state.caption;
      subInput.value = state.sub;
      const photo = query.get('photo') ?? 'pier';
      try {
        setSlot(0, await loadImage(`samples/${photo}.jpg`));
      } catch {
        // The scene draws with the placeholder panels instead.
      }
      try {
        setSlot(1, await loadImage(`samples/${photo === 'pier' ? 'boulevard' : 'pier'}.jpg`));
      } catch {
        // Same as above.
      }
      selectedSlot = 0;
      syncButtons();
      syncSlotControls();
      redraw();
    },
    redraw,
  );
} else {
  syncButtons();
  syncSlotControls();
  resizePreview();
  loadSamples().then(redraw);
}
