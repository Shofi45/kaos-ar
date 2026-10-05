let loading;

const loadCompiler = () => {
  if (!loading) {
    const url = new URL(
      import.meta.env.BASE_URL + "mindar/mindar-image.prod.js",
      window.location.origin,
    ).href;
    loading = import(/* @vite-ignore */ url).then((m) => {
      const C = m.Compiler || window.MINDAR?.IMAGE?.Compiler;
      if (!C) throw new Error("Compiler tidak ditemukan");
      return C;
    });
  }
  return loading;
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca"));
    };
    img.src = url;
  });

export const compileMind = async (file, onProgress) => {
  const { img, url } = await loadImage(file);
  try {
    const Compiler = await loadCompiler();
    const compiler = new Compiler();
    await compiler.compileImageTargets(
      [img],
      (p) => onProgress && onProgress(Math.round(p)),
    );
    const buffer = await compiler.exportData();
    return new Blob([buffer], { type: "application/octet-stream" });
  } finally {
    URL.revokeObjectURL(url);
  }
};
