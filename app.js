const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const chalk = require('chalk');

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const logFilePath = path.join(__dirname, 'server.log');

// === Fungsi Logging ===
function logMessage(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    // Simpan log ke file
    fs.appendFileSync(logFilePath, logEntry, 'utf8');

    // Tampilkan log ke terminal dengan warna
    const colors = {
        info: chalk.blue,
        success: chalk.green,
        error: chalk.red,
        warning: chalk.yellow,
    };

    console.log(colors[type](logEntry.trim()));
}

// Middleware untuk mencatat setiap request
app.use((req, res, next) => {
    logMessage(`📡 ${req.method} ${req.url}`, 'info');
    next();
});

// Mengatur rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    message: 'Terlalu banyak request. Coba lagi nanti.',
});

app.set('json spaces', 2);
app.use('/api/', limiter);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup multer untuk mengelola upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destination = req.body.destination || 'public';
        const folder = destination === 'public' ? 'public' : 'routes';
        cb(null, path.join(__dirname, folder));
    },
    filename: (req, file, cb) => {
        const customName = req.body.name || file.originalname;
        cb(null, customName);
    },
});

const upload = multer({ storage });

// Middleware untuk melayani file statis
app.use(express.static(path.join(__dirname, 'public')));

// Verifikasi password untuk akses halaman upload
app.get('/upload', (req, res) => {
    const password = req.query.password;
    if (password === process.env.UPLOAD_PASSWORD) {
        res.sendFile(path.join(__dirname, 'public', 'upload.html'));
    } else {
        res.status(403).send('Password salah. Akses ditolak.');
    }
});

// Endpoint untuk dokumentasi API
app.get('/docs', (req, res) => {
    const routesPath = path.join(__dirname, 'routes');

    fs.readdir(routesPath, (err, files) => {
        if (err) {
            logMessage('❌ Gagal membaca folder routes', 'error');
            return res.status(500).send('Gagal memuat dokumentasi.');
        }

        const apiEndpoints = files
            .filter((file) => file.endsWith('.js'))
            .map((file) => `/api/${file.replace('.js', '')}`);

        res.sendFile(path.join(__dirname, 'public', 'docs.html'), { headers: { 'x-api-list': JSON.stringify(apiEndpoints) } });
    });
});

// Endpoint untuk menampilkan halaman log
app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

// Endpoint API untuk mendapatkan log
app.get('/api/logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json(['Gagal membaca log.']);
        }
        res.json(data.split('\n').filter(line => line));
    });
});

// Fungsi untuk memperbarui package.json dan menginstal ulang modul
function updatePackageJson(moduleName, callback) {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.dependencies) packageJson.dependencies = {};
    if (!packageJson.dependencies[moduleName]) {
        packageJson.dependencies[moduleName] = 'latest';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        logMessage(`📦 Menambahkan ${moduleName} ke package.json dan menjalankan npm install...`, 'info');
        exec('npm install', (err, stdout, stderr) => {
            if (err) {
                logMessage(`❌ Gagal menginstal ${moduleName}: ${stderr}`, 'error');
            } else {
                console.log(stdout);
                console.error(stderr);
                callback();
            }
        });
    } else {
        callback();
    }
}

function registerRoutes() {
    const routesPath = path.join(__dirname, 'routes');

    Object.keys(require.cache).forEach((file) => {
        if (file.includes('/routes/')) delete require.cache[file];
    });

    fs.readdirSync(routesPath).forEach((file) => {
        if (file.endsWith('.js')) {
            const routePath = `/api/${file.replace('.js', '')}`;
            const modulePath = path.join(routesPath, file);

            try {
                const route = require(modulePath);
                app.use(routePath, route);
                logMessage(`${chalk.blue('[GET]')} ${routePath} ✅`, 'success');
            } catch (err) {
                logMessage(`❌ Gagal memuat ${file}: ${err.message}`, 'error');
            }
        }
    });

    logMessage('✅ Semua endpoint diperbarui!', 'success');
}

// Memantau perubahan di folder routes
fs.watch(path.join(__dirname, 'routes'), (eventType, filename) => {
    if (filename && (eventType === 'change' || eventType === 'rename')) {
        logMessage(`🔄 Perubahan terdeteksi di ${filename}, mereload endpoint...`, 'warning');
        registerRoutes();
    }
});

// Register routes saat server mulai
registerRoutes();

// Mulai server
app.listen(port, () => {
    logMessage(`🚀 Server berjalan di http://localhost:${port}`, 'success');
});
