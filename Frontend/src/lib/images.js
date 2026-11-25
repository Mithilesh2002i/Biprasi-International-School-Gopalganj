// Photo ko chhota karke (max 800px, JPEG) text ke roop mein save karte hain, taaki demo mein browser storage jaldi full na ho.
// Backend aane par: original file server/S3 par upload karo aur yahan URL return karo.
export function compressImage(file, max = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Photo padh nahi payi')); };
    img.src = url;
  });
}