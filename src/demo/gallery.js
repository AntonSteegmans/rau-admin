// Per-wagen fotogalerij — volledig client-side, opgeslagen in localStorage.
// Foto's worden vooraf verkleind (canvas) zodat de localStorage-quota niet volloopt.

const KEY = "rau-gallery";
const MAX_PER_VEHICLE = 12;

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {
    /* quota / geweigerd — stil falen */
  }
}

export function getPhotos(vehicleId) {
  const all = readAll();
  return Array.isArray(all[vehicleId]) ? all[vehicleId] : [];
}

export function addPhotos(vehicleId, dataUrls) {
  const all = readAll();
  const current = Array.isArray(all[vehicleId]) ? all[vehicleId] : [];
  const next = [...current, ...dataUrls].slice(0, MAX_PER_VEHICLE);
  all[vehicleId] = next;
  writeAll(all);
  return next;
}

export function removePhoto(vehicleId, index) {
  const all = readAll();
  const current = Array.isArray(all[vehicleId]) ? all[vehicleId] : [];
  current.splice(index, 1);
  all[vehicleId] = current;
  writeAll(all);
  return [...current];
}

// File -> verkleinde JPEG data-URL (langste zijde <= 1280px).
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      reject(new Error("Geen afbeelding"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lezen mislukt"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Laden mislukt"));
      img.onload = () => {
        const max = 1280;
        let { width, height } = img;
        if (width > max || height > max) {
          const scale = max / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
