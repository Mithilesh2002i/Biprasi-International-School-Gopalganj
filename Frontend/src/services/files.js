// File handling. Abhi uploaded files sirf current browser session mein chalti hain (blob URL).
// Backend aane par: file ko server/S3 par upload karo aur yahan permanent URL return karo.
const base = import.meta.env.BASE_URL;
export const SAMPLE = {
  video: `${base}samples/sample-video.mp4`,
  pdf: `${base}samples/sample-book.pdf`,
  exercise: `${base}samples/sample-exercise.pdf`,
};

const live = new Set();
export function registerFile(file) {
  const url = URL.createObjectURL(file);
  live.add(url);
  return { name: file.name, size: file.size, url };
}
// Page reload ke baad purane blob URLs mar jaate hain -> sample file dikhao (sirf demo ke liye)
export function resolveUrl(url, fallback = SAMPLE.pdf) {
  if (!url) return fallback;
  if (url.startsWith('blob:') && !live.has(url)) return fallback;
  return url;
}
