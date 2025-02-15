const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();
router.tags = ["tools"];

// Konfigurasi upload
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

// Endpoint untuk stabilisasi video
router.post("/", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Video tidak ditemukan" });

    const { stability = "5" } = req.body; // Ambil tingkat stabilitas dari form
    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, "../outputs/");
    const outputFilename = `${Date.now()}_stabilized.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Proses FFmpeg dengan filter stabilisasi vidstab
    const ffmpeg = spawn("/usr/bin/ffmpeg", [
        "-i", inputPath,
        "-filter:v", `vidstabdetect=stepsize=32:accuracy=${stability}:shakiness=10:show=none`, // Langkah pertama, mendeteksi stabilisasi
        "-f", "null", "/dev/null"
    ]);

    ffmpeg.stderr.on("data", (data) => {
        const log = data.toString();
        // Ambil progres dari log FFmpeg
        const progressMatch = log.match(/frame=\s*(\d+)\s*fps=\s*(\d+)/);
        if (progressMatch) {
            const framesProcessed = parseInt(progressMatch[1], 10);
            const framesTotal = parseInt(progressMatch[2], 10);
            const progress = (framesProcessed / framesTotal * 100).toFixed(2);
            res.write(JSON.stringify({ progress: `${progress}%` }) + "\n");
        }
    });

    ffmpeg.on("close", (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: "Gagal mendeteksi video untuk stabilisasi" });
        }

        // Setelah mendeteksi gerakan, proses stabilisasi
        const stabilizationProcess = spawn("/usr/bin/ffmpeg", [
            "-i", inputPath,
            "-filter:v", `vidstabtransform=input="transforms.trf":zoom=0:smoothing=${stability}`,
            "-preset", "fast",
            "-crf", "18",
            outputPath
        ]);

        stabilizationProcess.stderr.on("data", (data) => {
            const log = data.toString();
            // Ambil progres dari log FFmpeg
            const progressMatch = log.match(/frame=\s*(\d+)\s*fps=\s*(\d+)/);
            if (progressMatch) {
                const framesProcessed = parseInt(progressMatch[1], 10);
                const framesTotal = parseInt(progressMatch[2], 10);
                const progress = (framesProcessed / framesTotal * 100).toFixed(2);
                res.write(JSON.stringify({ progress: `${progress}%` }) + "\n");
            }
        });

        stabilizationProcess.on("close", (stabilizationCode) => {
            fs.unlinkSync(inputPath); // Hapus file upload

            if (stabilizationCode === 0) {
                const fileUrl = `${req.protocol}://${req.get("host")}/outputs/${outputFilename}`;
                res.write(JSON.stringify({ success: true, url: fileUrl }) + "\n");
                res.end();
            } else {
                res.status(500).json({ error: "Gagal menstabilkan video" });
            }
        });
    });
});

module.exports = router;
rts = router;
