const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const chalk = require('chalk'); // Import chalk untuk pewarnaan teks

// Memuat variabel lingkungan dari file .env
dotenv.config();

const app = express();
const port = process.env.PORT || 8080; // Gunakan port dinamis

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
const requiredModules = ['express', 'express-rate-limit', 'multer', 'chalk']; // Menggunakan chalk untuk warna
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

function registerRoutes() {
  const routesPath = path.join(__dirname, 'routes');

  // Hapus semua route sebelum daftar ulang
  Object.keys(require.cache).forEach((file) => {
    if (file.includes('/routes/')) delete require.cache[file];
  });

  // Baca ulang dan daftarkan semua file di folder routes
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
      const routePath = `/api/${file.replace('.js', '')}`;
      const modulePath = path.join(routesPath, file);

      try {
        const route = require(modulePath);
        app.use(routePath, route);
        console.log(`${chalk.blue('[GET]')} ${routePath} ✅`);
      } catch (err) {
        console.error(`❌ Gagal memuat ${file}:`, err);
      }
    }
  });

  console.log(chalk.green('✅ Semua endpoint diperbarui!'));
}

// Memantau perubahan di folder routes dan melakukan registrasi ulang
fs.watch(path.join(__dirname, 'routes'), (eventType, filename) => {
  if (filename && (eventType === 'change' || eventType === 'rename')) {
    console.log(chalk.green.bold(`Perubahan terdeteksi di file: ${filename}. Registrasi ulang endpoint...`));
    registerRoutes();
  }
});

// Register endpoints dinamis saat server mulai
registerRoutes();

// Mulai server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
