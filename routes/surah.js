const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Daftar Surah untuk pencocokan nama surah
const surahList = [
  "Al Fatihah", "Al Baqarah", "Ali Imran", "An Nisa", "Al Maidah", "Al Anam", "Al Araf", "Al Anfal", 
  "At Taubah", "Yunus", "Hud", "Yusuf", "Ar Rad", "Ibrahim", "Al Hijr", "An Nahl", "Al Isra", "Al Kahfi", 
  "Maryam", "Taha", "Al Anbiya", "Al Hajj", "Al Muminun", "An Nur", "Al Furqan", "Asy Syuara", "An Naml", 
  "Al Qasas", "Al Ankabut", "Ar Rum", "Luqman", "As Sajdah", "Al Ahzab", "Saba", "Fatir", "Yasin", "As Saffat", 
  "Sad", "Az Zumar", "Gafir", "Fussilat", "Asy Syura", "Az Zukhruf", "Ad Dukhan", "Al Jasiyah", "Al Ahqaf", 
  "Muhammad", "Al Fath", "Al Hujurat", "Qaf", "Az Zariyat", "At Tur", "An Najm", "Al Qamar", "Ar Rahman", 
  "Al Waqiah", "Al Hadid", "Al Mujadilah", "Al Hasyr", "Al Mumtahanah", "As Saff", "Al Jumuah", "Al Munafiqun", 
  "At Tagabun", "Al Talaq", "At Tahrim", "Al Mulk", "Al Qalam", "Al Haqqah", "Al Maarij", "Nuh", "Al Jinn", 
  "Al Muzzammil", "Al Muddassir", "Al Qiyamah", "Al Insan", "Al Mursalat", "An Naba", "An Naziat", "Abasa", 
  "At Takwir", "Al Infitar", "Al Mutaffifin", "Al-Insyiqaq", "Al Buruj", "At Tariq", "Al Ala", "Al-Gasyiyah", 
  "Al Fajr", "Al Balad", "Asy Syams", "Al Lail", "Ad Duha", "Asy Syarh", "At Tin", "Al Alaq", "Al Qadr", 
  "Al Bayyinah", "Al Zalzalah", "Al Adiyat", "Al Qariah", "At Takasur", "Al Asr", "Al Humazah", "Al Fil", 
  "Al Quraisy", "Al Maun", "Al Kausar", "Al Kafirun", "An Nasr", "Al Lahab", "Al Ikhlas", "Al Falaq", "An Nas"
];

// Fungsi untuk memilih Surah berdasarkan link yang diberikan
async function selectSurah(link) {
  let { data } = await axios.get(link);
  const $ = cheerio.load(data);
  const result = [];
  const isi = [];
  let surah = $("body > main > article > h1").text();
  let bismillah = $("body > main > article > p").text();
  
  $("body > main > article > ol > li:nth-child(n)").each((i, e) => {
    const arabic = $(e).find("p.arabic").text();
    const baca = $(e).find("p.translate").text();
    const arti = $(e).find("p.meaning").text();
    isi.push({
      arabic,
      baca,
      arti,
    });
  });

  result.push({ surah, bismillah }, isi);
  return result;
}

// Fungsi untuk mendapatkan daftar surah
async function listSurah() {
  let { data } = await axios.get("https://litequran.net/");
  const $ = cheerio.load(data);
  const result = [];
  
  $("body > main > ol > li:nth-child(n)").each((i, e) => {
    const nameSurah = $(e).find("a").text();
    const link = "https://litequran.net/" + $(e).find("a").attr("href");
    result.push({
      link,
      nameSurah,
    });
  });

  return result;
}

// Fungsi utama untuk mendapatkan surah berdasarkan query
async function getSurah(query) {
  let surahIndex;

  if (!isNaN(query)) {
    surahIndex = Number(query);
  } else {
    surahIndex = surahList.findIndex((s) => s.toLowerCase() === query.toLowerCase()) + 1;
  }

  if (surahIndex < 1 || surahIndex > surahList.length) {
    let listSurahText = surahList.map((s, i) => `${i + 1}. ${s}`).join("\n");
    return {
      status: 'error',
      message: `Nomor/Surah yang kamu cari tidak ada! Pastikan benar.\n\nBerikut daftar surah dan nomor urutnya:\n\n${listSurahText}`
    };
  }

  const surahListData = await listSurah();
  const selectedSurah = surahListData[surahIndex - 1];
  const surahContent = await selectSurah(selectedSurah.link);

  let response = `*Surah ${surahContent[0].surah}*\n`;
  response += `\n${surahContent[0].bismillah}\n\n`;
  response += `📜 *Ayat-ayatnya sebagai berikut:*\n\n`;

  surahContent[1].forEach((ayah, index) => {
    response += `*𖦹 Ayat ${index + 1}:*\n`;
    response += ` ${ayah.arabic}\n`;
    response += ` ${ayah.baca}\n`;
    response += ` ${ayah.arti}\n\n`;
  });

  response += `\n🤲 *Semoga kita diberkahi dengan petunjuk dari ayat-ayat ini.*\n`;

  return {
    status: 'success',
    surahData: response
  };
}

// API untuk mendapatkan surah berdasarkan query parameter 'q'
router.get('/', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      status: 'error',
      message: 'Parameter "q" diperlukan. Silakan masukkan nomor atau nama surah yang ingin dicari.'
    });
  }

  try {
    const surahData = await getSurah(query);

    if (surahData.status === 'error') {
      return res.status(400).json(surahData);
    }

    res.json({
      status: 'success',
      surahData: surahData.surahData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan dalam mengambil data surah.'
    });
  }
});

// Menambahkan tag ke router
router.tags = ['internet'];

module.exports = router;
