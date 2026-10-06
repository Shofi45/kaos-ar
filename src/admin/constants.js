export const BUCKET = "designs";

export const slugOk = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

export const withV = (u) => `${u}?v=${Date.now()}`;

export const designLink = () => `${window.location.origin}/`;
