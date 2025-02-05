const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const router = express.Router();
router.tags = ["tools"];

const uploadDir = path.join(__dirname, "../uploads/");
const outputDir = path.join(__dirname, "../outputs/");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// **Preset Resolusi**
const resolutions = {
  low: { width: 854, height: 480 },    // SD 480p
  medium: { width: 1280, height: 720 }, // HD 720p
  high: { width: 1920, height: 1080 },  // Full HD 1080p
  ultra: { width: 3840, height: 2160 }, // 4K UHD
};

// 📌 **Endpoint Upload & Upscale Video**
router.post("/upscale", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "File video tidak ditemukan!" });

  const inputFile = req.file.path;
  const quality = req.body.quality || "ultra"; // Default 4K
  const resolution = resolutions[quality];

  if (!resolution) {
    return res.status(400).json({ success: false, message: "Pilihan kualitas tidak valid!" });
  }

  const outputFile = path.join(outputDir, `upscaled_${quality}_${Date.now()}.mp4`);
  const ffmpegCmd = `ffmpeg -i "${inputFile}" -vf "scale=${resolution.width}:${resolution.height}:flags=lanczos" -preset slow "${outputFile}"`;

  exec(ffmpegCmd, (err) => {
    if (err) {
      console.error("FFmpeg Error:", err);
      return res.status(500).json({ success: false, message: "Upscale gagal!" });
    }

    fs.unlinkSync(inputFile); // 🔥 Hapus input buat hemat storage

    res.json({
      success: true,
      message: `Upscale berhasil ke ${resolution.width}x${resolution.height}!`,
      download: `/api/upscale/download?file=${path.basename(outputFile)}`,
    });
  });
});

// 📌 **Endpoint Download Hasil**
router.get("/upscale/download", (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).json({ success: false, message: "Nama file tidak diberikan!" });

  const filePath = path.join(outputDir, file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "File tidak ditemukan!" });

  res.download(filePath, (err) => {
    if (!err) fs.unlinkSync(filePath); // 🔥 Auto-hapus setelah download biar hemat storage
  });
});

module.exports = router;
