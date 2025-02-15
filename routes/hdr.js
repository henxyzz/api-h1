const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const router = express.Router();

// Setup multer untuk menangani upload gambar
const upload = multer({ dest: path.join(os.tmpdir(), 'uploads') });

// Folder untuk menyimpan file cache gambar yang sudah diproses
const cacheFolder = path.join(os.tmpdir(), 'cache');
if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder, { recursive: true });
}

// Fungsi untuk menghasilkan nama file cache berdasarkan hash
function generateCacheFileName(file, params) {
  const hash = crypto.createHash('sha256');
  hash.update(file.originalname);
  hash.update(params.brightness + params.saturation + params.sharpness + params.format);
  return hash.digest('hex') + '.' + params.format;
}

// Preset Mode untuk pengaturan gambar
const presets = {
  default: {
    brightness: 1.1,
    saturation: 1.1,
    sharpness: 1,
  },
  bright: {
    brightness: 1.5,
    saturation: 1.2,
    sharpness: 1.2,
  },
  vivid: {
    brightness: 1.3,
    saturation: 1.5,
    sharpness: 1.3,
  },
  muted: {
    brightness: 0.9,
    saturation: 0.8,
    sharpness: 0.9,
  },
};

// Endpoint untuk memproses gambar HDR dengan mode preset atau kustom
router.get('/', upload.single('image'), async (req, res) => {
  const { image, brightness = 1.1, saturation = 1.1, sharpness = 1, mode = 'default', format = 'jpeg' } = req.query;

  // Menampilkan petunjuk jika parameter gambar tidak ada
  if (!image) {
    return res.status(400).json({
      error: 'URL gambar diperlukan.',
      usage: 'Silakan sertakan URL gambar dengan parameter "image" dalam query string. Contoh: /api/hdr?image=http://example.com/image.jpg&brightness=1.2&saturation=1.3&sharpness=1.5&mode=bright&format=jpeg'
    });
  }

  // Validasi mode dan mengambil preset jika mode valid
  const selectedPreset = mode.toLowerCase() === 'set' ? {
    brightness: parseFloat(brightness),
    saturation: parseFloat(saturation),
    sharpness: parseFloat(sharpness),
  } : presets[mode.toLowerCase()] || presets['default'];

  try {
    // Cek apakah file yang sama sudah ada dalam cache
    const cacheFileName = generateCacheFileName({ originalname: image }, { brightness, saturation, sharpness, mode, format });
    const cachedFilePath = path.join(cacheFolder, cacheFileName);

    if (fs.existsSync(cachedFilePath)) {
      // File sudah ada di cache, kembalikan file yang sudah diproses
      return res.json({
        message: "Gambar berhasil diproses dan dikirim.",
        processed_image_url: `http://localhost:8000/uploads/cache/${cacheFileName}`,
        usage: 'Gambar yang sama sudah ada di cache. Gunakan parameter yang berbeda jika ingin memproses ulang gambar.'
      });
    }

    // Memperbaiki kualitas gambar (HDR effect dengan kontrol parameter)
    await sharp(image)
      .modulate({ brightness: selectedPreset.brightness, saturation: selectedPreset.saturation })
      .sharpen(selectedPreset.sharpness)
      .toFormat(format) // Menentukan format output berdasarkan parameter
      .toFile(cachedFilePath);

    // Mengirimkan URL gambar yang sudah diproses
    res.json({
      message: "Gambar berhasil diproses dan dikirim.",
      processed_image_url: `http://localhost:8000/uploads/cache/${cacheFileName}`,
      usage: 'Untuk mendapatkan gambar yang sudah diproses, gunakan parameter yang sama atau sesuaikan dengan kebutuhan Anda.'
    });

    // Hapus cache setelah 5 menit
    setTimeout(() => fs.unlinkSync(cachedFilePath), 5 * 60 * 1000);

  } catch (error) {
    console.error('Terjadi kesalahan saat memproses gambar:', error);
    res.status(500).json({
      error: 'Terjadi kesalahan saat memproses gambar.',
      message: 'Pastikan URL gambar yang dikirimkan valid dan dapat diakses.',
      usage: 'Jika ada kesalahan, pastikan URL gambar valid dan menggunakan format yang sesuai. Contoh: /api/hdr?image=http://example.com/image.jpg&brightness=1.2&saturation=1.3&sharpness=1.5&mode=bright&format=jpeg'
    });
  }
});

// Export router
module.exports = router;
