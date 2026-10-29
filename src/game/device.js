const DEVICE_KEY = "zf_device";

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `tmp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

export const getSavedCode = (slug) => {
  try {
    return localStorage.getItem(`zf_code_${slug}`) || "";
  } catch {
    return "";
  }
};

export const saveCode = (slug, code) => {
  try {
    localStorage.setItem(`zf_code_${slug}`, code);
  } catch {
    /* penyimpanan diblokir */
  }
};

export const clearCode = (slug) => {
  try {
    localStorage.removeItem(`zf_code_${slug}`);
  } catch {
    /* penyimpanan diblokir */
  }
};
