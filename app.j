const express = require("express");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { execSync } = require("child_process");
const chalk = require("chalk");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const routesDir = path.join(__dirname, "routes");
const logFile = path.join(__dirname, "log.txt");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: "Terlalu banyak request. Coba lagi nanti.",
});

app.set("json spaces", 2);
app.use("/api/", limiter);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files like index.html and docs.html

// Fungsi clear console
const clearConsole = () => {
  process.stdout.write("\x1Bc");
};

// Fungsi mencatat log (overwrite setiap update)
const writeLog = (message) => {
  const timestamp = new Date().toLocaleString();
  fs.writeFileSync(logFile, `[${timestamp}] ${message}\n`, "utf8");
};

// Fungsi register ulang endpoint dan hitung API berdasarkan tags
const registerRoutes = () => {
  clearConsole();
  app._router.stack = app._router.stack.slice(0, 2); // Reset router kecuali bawaan Express

  console.log(chalk.green("\n✅ Semua endpoint diperbarui!\n"));
  writeLog("🔄 Semua endpoint diperbarui");

  const files = fs.readdirSync(routesDir).filter((file) => file.endsWith(".js"));

  const tagsCount = {};
  const tagEndpoints = {};

  files.forEach((file) => {
    const routePath = path.join(routesDir, file);
    const routeName = `/api/${file.replace(".js", "")}`;

    try {
      delete require.cache[require.resolve(routePath)];
      const routeModule = require(routePath);
      app.use(routeName, routeModule);

      if (routeModule.tags) {
        routeModule.tags.forEach((tag) => {
          tagsCount[tag] = (tagsCount[tag] || 0) + 1;
          if (!tagEndpoints[tag]) tagEndpoints[tag] = [];
          tagEndpoints[tag].push(routeName);
        });
      }

      console.log(`${chalk.blue("[GET]")} ${routeName} ✅`);
    } catch (err) {
      console.error(`${chalk.red("[ERR]")} ${routeName} ❌ ${chalk.red(err.message)}`);
    }
  });

  console.log("\n📊 Statistik API berdasarkan Tags:");
  Object.keys(tagEndpoints).forEach((tag) => {
    console.log(`${chalk.yellow(tag)}:`);
    tagEndpoints[tag].forEach((endpoint) => {
      console.log(`${chalk.blue("[GET]")} ${endpoint}`);
    });
    console.log("");
  });

  console.log(chalk.green("\n✅ Semua endpoint siap digunakan!\n"));
};

// Pantau perubahan di folder routes
fs.watch(routesDir, (eventType, filename) => {
  if (filename) {
    if (filename.endsWith(".swp")) {
      console.log(chalk.red(`⚠️  File swap terdeteksi: ${filename}. Membersihkan console...`));
      writeLog(`⚠️  File swap terdeteksi: ${filename}`);
      clearConsole();
    } else {
      console.log(chalk.green(`🔄 Perubahan terdeteksi di file: ${filename}. Registrasi ulang endpoint...`));
      writeLog(`🔄 Perubahan terdeteksi di file: ${filename}`);
      registerRoutes();
    }
  }
});

// Gunakan app.use untuk serve index.html dan docs.html
app.use("/", express.static(path.join(__dirname, "public")));  // Serve index.html dan file lain di folder public

// Register routes saat startup
registerRoutes();

// Start server
app.listen(port, () => {
  console.log(chalk.cyan(`🚀 Server berjalan di http://localhost:${port}`));
});
