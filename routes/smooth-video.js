const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

const router = express.Router();
router.tags = ["tools"];

const uploadDir = "uploads/";
const outputDir = "outputs/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Konfigurasi Multer untuk upload video
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// API untuk meningkatkan FPS video
router.post("/", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "File video tidak ditemukan!" });

    const inputPath = req.file.path;
    const outputPath = `${outputDir}smooth_${Date.now()}.mp4`;

    ffmpeg(inputPath)
        .outputOptions("-filter:v", "minterpolate=fps=60")
        .on("end", () => {
            fs.unlinkSync(inputPath);
            res.json({ status: "success", url: `${outputPath.replace("outputs/", "")}` });
        })
        .on("error", (err) => res.status(500).json({ error: err.message }))
        .save(outputPath);
});

module.exports = router;
