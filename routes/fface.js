const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const faceapi = require("face-api.js");
const canvas = require("canvas");

// Buat router
const router = express.Router();
router.tags = ["tools"]; // Kategori API

// Setup penyimpanan file upload
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".png", ".jpg", ".jpeg"];
    if (!allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error("Hanya file PNG, JPG, atau JPEG yang diperbolehkan"));
    }
    cb(null, true);
  },
});

// Load model face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
  const modelPath = path.join(__dirname, "../models");
  await faceapi.nets.faceExpressionNet.loadFromDisk(modelPath);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
}

loadModels();

// Endpoint untuk mendeteksi ekspresi wajah
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Harap unggah gambar terlebih dahulu" });

  try {
    // Baca file gambar
    const img = await canvas.loadImage(req.file.path);

    // Analisis wajah
    const detection = await faceapi.detectSingleFace(img).withFaceExpressions();

    if (!detection) return res.status(400).json({ error: "Tidak ada wajah yang terdeteksi dalam gambar" });

    // Hapus file setelah diproses
    fs.unlinkSync(req.file.path);

    // Kirim hasil analisis
    res.json({
      message: "Ekspresi wajah berhasil dideteksi",
      expressions: detection.expressions, // Hasil ekspresi wajah (JSON)
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses gambar", detail: error.message });
  }
});

module.exports = router;
