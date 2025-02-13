const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();
router.tags = ["video", "remove-background"];

// Konfigurasi upload
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

// Endpoint Remove Background dari Video
router.post("/", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Video tidak ditemukan" });

    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, "../outputs/");
    const outputFilename = `${Date.now()}_nobg.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Panggil Python Script buat Remove Background
    const pythonProcess = spawn("python3", ["../remove_bg.py", inputPath, outputPath]);

    pythonProcess.stdout.on("data", (data) => {
        console.log(`Progress: ${data}`);
    });

    pythonProcess.on("close", (code) => {
        fs.unlinkSync(inputPath); // Hapus file upload setelah selesai

        if (code === 0) {
            const fileUrl = `${req.protocol}://${req.get("host")}/outputs/${outputFilename}`;
            res.json({ success: true, url: fileUrl });
        } else {
            res.status(500).json({ error: "Gagal menghapus background video" });
        }
    });
});

module.exports = router;
