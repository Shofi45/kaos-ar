// Masuk mode layar penuh dan mengunci landscape (hanya didukung sebagian browser).
export async function enterLandscape() {
  try {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      await el.requestFullscreen();
    }
  } catch {
    /* tidak didukung atau ditolak */
  }
  try {
    await window.screen?.orientation?.lock?.("landscape");
  } catch {
    /* iPhone dan sebagian browser tidak mengizinkan */
  }
}

export function exitLandscape() {
  try {
    window.screen?.orientation?.unlock?.();
  } catch {
    /* abaikan */
  }
  try {
    if (document.fullscreenElement) document.exitFullscreen();
  } catch {
    /* abaikan */
  }
}

export const isPortrait = () => window.innerHeight > window.innerWidth;
