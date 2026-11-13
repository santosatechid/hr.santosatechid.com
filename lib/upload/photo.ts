const MAX_BYTES = 2 * 1024 * 1024;
const MIN_PIXELS = 400;
const MAX_EDGE = 512;

/**
 * Foto profil dibaca jadi data URL base64 (tanpa file server), sesuai pola
 * upload foto profil di dokumen: JPG/PNG dari galeri, dibatasi 2 MB.
 *
 * Sebelum disimpan, gambar diperkecil ke maksimal 512 px sisi terpanjang
 * supaya payload profil tidak membengkak, lalu di-encode JPEG.
 */
export async function uploadPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Pilih file gambar (JPG atau PNG).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Ukuran foto maksimal 2 MB. Kompres dulu, ya.");
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    throw new Error("Foto tidak bisa dibaca. Coba file lain.");
  }

  const { width, height } = bitmap;
  if (width < MIN_PIXELS || height < MIN_PIXELS) {
    bitmap.close();
    throw new Error(`Foto minimal ${MIN_PIXELS}×${MIN_PIXELS} px.`);
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Browser gagal memproses foto. Coba browser lain.");
  }
  // PNG transparan perlu latar putih, JPEG tidak menyimpan alpha.
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}
