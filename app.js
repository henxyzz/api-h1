const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const WebSocket = require('ws');

// Memuat variabel lingkungan dari file .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Gunakan port dinamis

// Setup WebSocket
const wss = new WebSocket.Server({ server: app.listen(port) });

// Membuat koneksi WebSocket
wss.on('connection', ws => {
  console.log('Client terhubung');

  ws.on('message', message => {
    console.log('Perintah diterima:', message);

    // Eksekusi perintah
    exec(message, (error, stdout, stderr) => {
      if (error) {
        ws.send(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        ws.send(`stderr: ${stderr}`);
        return;
      }
      ws.send(`stdout: ${stdout}`);
    });
  });

  ws.on('close', () => {
    console.log('Client terputus');
  });

  ws.send('Koneksi WebSocket terbuka. Silakan kirim perintah.');
});

// Fungsi untuk memeriksa dan menginstal modul yang hilang
function checkAndInstallModule(moduleName, callback) {
  try {
    require.resolve(moduleName);
    callback(); // Modul sudah terinstal, lanjutkan proses
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`${moduleName} tidak ditemukan, menginstal...`);
      exec(`npm install ${moduleName}`, (err, stdout, stderr) => {
        if (err) {
          console.error(`Error menginstal ${moduleName}:`, stderr);
          return;
        }
        console.log(stdout);
        callback(); // Lanjutkan setelah instalasi selesai
      });
    } else {
      console.error('Terjadi kesalahan saat memeriksa modul:', e);
    }
  }
}

// Memeriksa dan menginstal modul yang diperlukan
const requiredModules = ['express', 'express-rate-limit', 'multer', 'ws']; // Daftar modul yang diperlukan
requiredModules.forEach(module => {
  checkAndInstallModule(module, () => {
    console.log(`${module} siap digunakan.`);
  });
});

// Mengatur rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 1000, // Maksimal 1000 request per menit
  message: 'Terlalu banyak request. Coba lagi nanti.',
});

app.set('json spaces', 2);

app.use('/api/', limiter); // Gunakan rate limiter untuk semua endpoint API
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup multer untuk mengelola upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = req.body.destination || 'public'; // Default ke public jika kosong
    const folder = destination === 'public' ? 'public' : 'routes';
    cb(null, path.join(__dirname, folder));
  },
  filename: (req, file, cb) => {
    const customName = req.body.name || file.originalname; // Nama file custom jika diberikan
    cb(null, customName);
  },
});

const upload = multer({ storage });

// Middleware untuk melayani file statis
app.use(express.static(path.join(__dirname, 'public')));

// Verifikasi password untuk akses halaman upload
app.get('/upload', (req, res) => {
  const password = req.query.password; // Mengambil password dari query string

  if (password === process.env.UPLOAD_PASSWORD) {
    res.sendFile(path.join(__dirname, 'public', 'upload.html')); // Akses halaman upload
  } else {
    res.status(403).send('Password salah. Akses ditolak.');
  }
});

// Endpoint untuk menampilkan dokumentasi API
app.get('/docs', (req, res) => {
  const routesPath = path.join(__dirname, 'routes');

  // Ambil semua file di folder routes
  fs.readdir(routesPath, (err, files) => {
    if (err) {
      console.error('Gagal membaca folder routes:', err);
      return res.status(500).send('Gagal memuat dokumentasi.');
    }

    // Filter file .js dan buat daftar endpoint
    const apiEndpoints = files
      .filter((file) => file.endsWith('.js'))
      .map((file) => `/api/${file.replace('.js', '')}`);

    // Kirim file docs.html dan daftar API ke klien
    res.sendFile(path.join(__dirname, 'public', 'docs.html'), { headers: { 'x-api-list': JSON.stringify(apiEndpoints) } });
  });
});

// Endpoint untuk menangani file upload
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('req.file:', req.file); // Debug informasi file
  console.log('req.body:', req.body); // Debug informasi form

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File tidak ditemukan. Pastikan form upload memiliki field 'file'.",
    });
  }

  const folder = req.body.destination || 'public';
  const filePath = path.join(__dirname, folder, req.file.filename);

  if (folder === 'routes') {
    const moduleName = req.file.filename.replace('.js', '');
    updatePackageJson(moduleName, () => {
      res.send(`File JavaScript berhasil diupload dan endpoint tersedia di /api/${moduleName}`);
      registerRoutes(); // Registrasi ulang endpoint
    });
  } else {
    res.send(`File berhasil diupload ke folder ${folder}`);
  }
});

// Fungsi untuk memperbarui package.json dan menginstal ulang modul
function updatePackageJson(moduleName, callback) {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.dependencies) packageJson.dependencies = {};
  if (!packageJson.dependencies[moduleName]) {
    packageJson.dependencies[moduleName] = 'latest';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log(`Menambahkan ${moduleName} ke package.json dan menjalankan npm install...`);
    exec('npm install', (err, stdout, stderr) => {
      if (err) {
        console.error('Gagal menginstal modul:', err);
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

// Fungsi untuk meregistrasi endpoint dinamis dari folder routes
function registerRoutes() {
  const routesPath = path.join(__dirname, 'routes');
  fs.readdir(routesPath, (err, files) => {
    if (err) {
      console.error('Gagal membaca folder routes:', err);
      return;
    }

    files.forEach((file) => {
      if (file.endsWith('.js')) {
        const routePath = `/api/${file.replace('.js', '')}`;
        const modulePath = path.join(__dirname, 'routes', file);

        // Hapus cache sebelumnya (hot reload)
        delete require.cache[require.resolve(modulePath)];

        // Daftarkan endpoint
        try {
          const route = require(modulePath);
          app.use(routePath, route);
          console.log(`Endpoint otomatis terdaftar: ${routePath}`);
        } catch (err) {
          console.error(`Gagal meregistrasi file ${file} sebagai endpoint:`, err);
        }
      }
    });
  });
}

// Register endpoints dinamis saat server mulai
registerRoutes();

// Monitor perubahan pada folder routes
fs.watch(path.join(__dirname, 'routes'), (eventType, filename) => {
  if (eventType === 'change' || eventType === 'rename') {
    console.log(`Perubahan terdeteksi pada file: ${filename}`);
    registerRoutes(); // Daftarkan ulang endpoint
  }
});

// Mulai server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
}); 