const express = require("express");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { exec } = require("child_process");
const chalk = require("chalk");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const logFilePath = path.join(__dirname, "server.log");

// === Fungsi Logging ===
function logMessage(message, type = "info") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(logFilePath, logEntry, "utf8");

    const colors = {
        info: chalk.blue,
        success: chalk.green,
        error: chalk.red,
        warning: chalk.yellow,
    };

    console.log(colors[type](logEntry.trim()));
}

// Middleware Logging
app.use((req, res, next) => {
    logMessage(`📡 ${req.method} ${req.url}`, "info");
    next();
});

// === Auto Install Module ===
process.on("uncaughtException", (err) => {
    if (err.code === "MODULE_NOT_FOUND") {
        const moduleName = err.message.split("'")[1];

        logMessage(`⚠️ Module ${moduleName} tidak ditemukan. Menginstal...`, "warning");

        exec(`npm install ${moduleName}`, (installErr, stdout, stderr) => {
            if (installErr) {
                logMessage(`❌ Gagal menginstal ${moduleName}: ${stderr}`, "error");
            } else {
                logMessage(`✅ Module ${moduleName} berhasil diinstal. Restart server...`, "success");
                process.exit(1);
            }
        });
    } else {
        logMessage(`❌ Error tidak terduga: ${err.message}`, "error");
    }
});

// === Rate Limit ===
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    message: "Terlalu banyak request. Coba lagi nanti.",
});

app.set("json spaces", 2);
app.use("/api/", limiter);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// === Middleware Upload ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.body.destination || "public";
        cb(null, path.join(__dirname, folder));
    },
    filename: (req, file, cb) => {
        cb(null, req.body.name || file.originalname);
    },
});
const upload = multer({ storage });
app.use(upload.any()); // Middleware upload global

// === Serve Static Files ===
app.use(express.static(path.join(__dirname, "public")));

// === Halaman Upload ===
app.get("/upload", (req, res) => {
    const password = req.query.password;
    if (password === process.env.UPLOAD_PASSWORD) {
        res.sendFile(path.join(__dirname, "public", "upload.html"));
    } else {
        res.status(403).send("Password salah. Akses ditolak.");
    }
});

// ====================== 🔥 API LOG CONSOLE 🔥 ======================

// Endpoint untuk mendapatkan semua log dalam bentuk JSON
app.get('/api/logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            logMessage('❌ Gagal membaca log!', 'error');
            return res.status(500).json({ error: 'Gagal membaca log.' });
        }

        const logs = data.split('\n').filter(line => line); // Hapus baris kosong
        res.json({ logs });
    });
});

// Endpoint untuk melihat log langsung di browser
app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

// === API Documentation Endpoint ===
app.get("/api/docs", (req, res) => {
    const routesPath = path.join(__dirname, "routes");
    let apiDocs = {};

    fs.readdirSync(routesPath).forEach((file) => {
        if (file.endsWith(".js")) {
            const route = require(path.join(routesPath, file));

            if (route.tags) {
                route.tags.forEach((tag) => {
                    if (!apiDocs[tag]) apiDocs[tag] = [];
                    apiDocs[tag].push(`/api/${file.replace(".js", "")}`);
                });
            }
        }
    });

    res.json(apiDocs);
});

// === Load Routes Otomatis ===
function registerRoutes() {
    const routesPath = path.join(__dirname, "routes");

    Object.keys(require.cache).forEach((file) => {
        if (file.includes("/routes/")) delete require.cache[file];
    });

    fs.readdirSync(routesPath).forEach((file) => {
        if (file.endsWith(".js")) {
            const routePath = `/api/${file.replace(".js", "")}`;
            const modulePath = path.join(routesPath, file);

            try {
                const route = require(modulePath);
                app.use(routePath, route);
                logMessage(`${chalk.blue("[GET]")} ${routePath} ✅`, "success");
            } catch (err) {
                logMessage(`❌ Gagal memuat ${file}: ${err.message}`, "error");
            }
        }
    });

    logMessage("✅ Semua endpoint diperbarui!", "success");
}

// === Watch Changes di Routes ===
fs.watch(path.join(__dirname, "routes"), (eventType, filename) => {
    if (filename && (eventType === "change" || eventType === "rename")) {
        logMessage(`🔄 Perubahan terdeteksi di ${filename}, mereload endpoint...`, "warning");
        registerRoutes();
    }
});

// === Daftarkan Routes saat Server Mulai ===
registerRoutes();

// === Jalankan Server ===
app.listen(port, () => {
    logMessage(`🚀 Server berjalan di http://localhost:${port}`, "success");
});
