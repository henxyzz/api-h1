const express = require("express");
const QRCode = require("qrcode");
const router = express.Router();

router.tags = ["tools"];

router.get("/", async (req, res) => {
    const { mode, query, nama, nomor, deskripsi } = req.query;

    // Jika mode tidak diisi atau salah
    if (!mode || !["nomor", "url", "kontak"].includes(mode)) {
        return res.status(400).json({
            error: "Mode tidak valid atau tidak diisi.",
            petunjuk: "Gunakan mode yang tersedia: nomor, url, kontak",
            contoh: {
                nomor: "/api/qrcode?mode=nomor&query=08123456789",
                url: "/api/qrcode?mode=url&query=google.com",
                kontak: "/api/qrcode?mode=kontak&nama=John%20Doe&nomor=08123456789&deskripsi=Teman%20kerja"
            }
        });
    }

    let qrData;
    switch (mode) {
        case "nomor":
            if (!query) {
                return res.status(400).json({
                    error: "Parameter query wajib diisi untuk nomor.",
                    petunjuk: "Gunakan query untuk nomor telepon.",
                    contoh: "/api/qrcode?mode=nomor&query=08123456789"
                });
            }
            qrData = `tel:${query}`;
            break;

        case "url":
            if (!query) {
                return res.status(400).json({
                    error: "Parameter query wajib diisi untuk URL.",
                    petunjuk: "Gunakan query untuk URL yang valid.",
                    contoh: "/api/qrcode?mode=url&query=https://google.com"
                });
            }
            qrData = query.startsWith("http") ? query : `https://${query}`;
            break;

        case "kontak":
            if (!nama || !nomor) {
                return res.status(400).json({
                    error: "Parameter nama dan nomor wajib diisi untuk kontak.",
                    petunjuk: "Gunakan nama dan nomor untuk membuat vCard.",
                    contoh: "/api/qrcode?mode=kontak&nama=John%20Doe&nomor=08123456789&deskripsi=Teman%20kerja"
                });
            }
            qrData = `BEGIN:VCARD\nVERSION:3.0\nFN:${nama}\nTEL:${nomor}`;
            if (deskripsi) qrData += `\nNOTE:${deskripsi}`;
            qrData += `\nEND:VCARD`;
            break;
    }

    try {
        res.setHeader("Content-Type", "image/png");
        await QRCode.toFileStream(res, qrData);
    } catch (err) {
        res.status(500).json({ error: "Gagal membuat QR Code" });
    }
});

module.exports = router;
