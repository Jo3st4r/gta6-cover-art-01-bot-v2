// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, filling the viewport.
// `layout`, `grade`, `photo` (sample name), `caption` and `sub` come from the
// query. window.__shotReady is set once the fonts are in and the cover is painted.
//
// setup(query) loads the scene's photos and state and draws once; redraw() paints
// again, which the shot waits for after the fonts arrive.

export async function runShot(shot, query, setup, redraw) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup(query);
  try {
    await document.fonts.ready;
  } catch {
    // The cover still draws with the fallback face.
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
