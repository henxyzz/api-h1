const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk");
const dotenv = require("dotenv");
const chokidar = require("chokidar");

const app = express();
dotenv.config();

// 🔹 Cek & Install Module npm yang Hilang
function ensureModuleInstalled(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (err) {
    console.log(chalk.yellow(`📦 Module '${moduleName}' belum terinstall. Menginstall...`));
    try {
      execSync(`npm install ${moduleName}`, { stdio: "inherit" });
      console.log(chalk.green(`✅ Module '${moduleName}' berhasil diinstall!`));
      return true;
    } catch (installErr) {
      console.log(chalk.red(`❌ Gagal install module '${moduleName}'!`));
      return false;
    }
  }
}

// 🔹 Logging ke file & console
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

// 🔹 Middleware Global
app.set("json spaces", 2);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/outputs", express.static(path.join(__dirname, "outputs")));

// 🔹 Rate Limiter
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: "Terlalu banyak request. Coba lagi nanti.",
});
app.use("/api/", limiter);

// 🔹 Load Routes Otomatis
function loadRoutes() {
  const routesPath = path.join(__dirname, "routes");
  let apiDocs = {};

  if (!fs.existsSync(routesPath)) {
    fs.mkdirSync(routesPath);
  }

  fs.readdirSync(routesPath).forEach((file) => {
    const routeFile = path.join(routesPath, file);
    const routeName = path.basename(file, ".js");
    try {
      console.log(`🔄 Memeriksa module untuk '${routeName}'...`);
      const routeCode = fs.readFileSync(routeFile, "utf8");
      const moduleMatches = routeCode.match(/require["'`](.*?)["'`]/g) || [];

      moduleMatches.forEach((match) => {
        const moduleName = match.match(/require["'`](.*?)["'`]/)[1];
        if (!moduleName.startsWith(".")) {
          ensureModuleInstalled(moduleName);
        }
      });

      const route = require(routeFile);
      const routePath = `/api/${routeName}`;
      app.use(routePath, route);

      if (route.tags) {
        route.tags.forEach((tag) => {
          if (!apiDocs[tag]) apiDocs[tag] = [];
          apiDocs[tag].push(routePath);
        });
      }

      console.log(chalk.green(`✅ Endpoint terdaftar: ${routePath}`));
    } catch (error) {
      console.log(chalk.red(`❌ Error pada route '${routeName}': ${error.message}`));
    }
  });

  return apiDocs;
}

let apiDocs = loadRoutes();

// 🔹 Watcher: Auto Reload Routes Saat Ada Perubahan
const watcher = chokidar.watch(path.join(__dirname, "routes"), { ignored: /^\./, persistent: true });

watcher.on("add", (filePath) => {
  const moduleName = path.basename(filePath, ".js");
  console.log(`📂 File baru terdeteksi: ${moduleName}. Memeriksa dependensi...`);

  setTimeout(() => {
    delete require.cache[require.resolve(filePath)];
    const route = require(filePath);
    const routePath = `/api/${moduleName}`;
    app.use(routePath, route);
    console.log(chalk.green(`✅ Endpoint baru terdaftar: ${routePath}`));
  }, 1000);
});

watcher.on("change", (filePath) => {
  const moduleName = path.basename(filePath, ".js");
  console.log(`✏️ File diubah: ${moduleName}. Memperbarui route...`);

  delete require.cache[require.resolve(filePath)];
  const route = require(filePath);
  const routePath = `/api/${moduleName}`;

  app._router.stack = app._router.stack.filter(layer => !(layer.route && layer.route.path === routePath));
  app.use(routePath, route);
  console.log(chalk.green(`✅ Endpoint diperbarui: ${routePath}`));
});

watcher.on("unlink", (filePath) => {
  const moduleName = path.basename(filePath, ".js");
  console.log(`🗑️ File dihapus: ${moduleName}. Menghapus route...`);

  const routePath = `/api/${moduleName}`;
  app._router.stack = app._router.stack.filter(layer => !(layer.route && layer.route.path === routePath));

  for (const tag in apiDocs) {
    apiDocs[tag] = apiDocs[tag].filter(path => path !== routePath);
  }

  console.log(chalk.green(`✅ Endpoint dihapus: ${routePath}`));
});

// 🔹 API Docs
app.get("/api/docs", (req, res) => {
  const apiDocsWithCount = {};
  for (const tag in apiDocs) {
    apiDocsWithCount[tag] = {
      count: apiDocs[tag].length,
      endpoints: apiDocs[tag],
    };
  }
  res.json(apiDocsWithCount);
});

// 🔹 Halaman Utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Jangan pakai listen() di Vercel
let sudahLog = false;

module.exports = (req, res) => {
  if (!sudahLog) {
    logMessage(`🚀 Server berjalan di Serverless Mode (Vercel)`, "success");

    console.log("\n🎯 API Endpoints per tag:");
    for (const tag in apiDocs) {
      console.log(chalk.yellow(`\nTag: ${tag} - ${apiDocs[tag].length} API`));
      apiDocs[tag].forEach(endpoint => {
        console.log(chalk.green(`  - ${endpoint}`));
      });
    }

    sudahLog = true;
  }

  app(req, res); // Ini yang ngejalanin express-nya
};