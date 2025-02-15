const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();
router.tags = ["tools"];

// Konfigurasi upload video
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

// Regex untuk membaca durasi dan progress FFmpeg
const durationRegex = /Duration: (\d+):(\d+):(\d+\.\d+)/;
const timeRegex = /time=(\d+):(\d+):(\d+\.\d+)/;

// API untuk mengubah FPS video
router.post("/", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Video tidak ditemukan" });

    const { fps = 60 } = req.body;
    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, "../outputs/");
    const outputFilename = `${Date.now()}_${fps}fps.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Kirim progress upload 100% karena sudah diunggah
    res.write(JSON.stringify({ uploadProgress: "100%" }) + "\n");

    let totalDuration = 0;
    let responseSent = false;

    // Jalankan FFmpeg untuk mengubah FPS
    const ffmpeg = spawn("/usr/bin/ffmpeg", [
        "-i", inputPath,
        "-r", fps,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        outputPath
    ]);

    ffmpeg.stderr.on("data", (data) => {
        const log = data.toString();

        // Ambil durasi total video
        const durationMatch = log.match(durationRegex);
        if (durationMatch) {
            const hours = parseFloat(durationMatch[1]);
            const minutes = parseFloat(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            totalDuration = hours * 3600 + minutes * 60 + seconds;
        }

        // Ambil progress dari waktu berjalan
        const timeMatch = log.match(timeRegex);
        if (timeMatch && totalDuration > 0) {
            const hours = parseFloat(timeMatch[1]);
            const minutes = parseFloat(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            const progress = ((currentTime / totalDuration) * 100).toFixed(2);

            console.log(`Progress: ${progress}%`);
            res.write(JSON.stringify({ processProgress: `${progress}%` }) + "\n");
        }
    });

    ffmpeg.on("close", (code) => {
        fs.unlinkSync(inputPath); // Hapus file upload

        if (code === 0) {
            const fileUrl = `/outputs/${outputFilename}`;
            res.write(JSON.stringify({ success: true, url: fileUrl }) + "\n");
            res.end();
        } else {
            res.status(500).json({ error: "Gagal meng-upscale video" });
        }

        responseSent = true;
    });
});

module.exports = router;
exports = router;
