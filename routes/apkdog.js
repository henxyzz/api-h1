const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Fungsi untuk download aplikasi
async function apkdogDownload(appUrl) {
    try {
        const { data } = await axios.get(appUrl);
        const $ = cheerio.load(data);
        const results = [];

        const downloadLinks = $('.dwn_btn_wrap a.dwn1');

        for (let index = 0; index < downloadLinks.length; index++) {
            const element = downloadLinks[index];
            const downloadUrl = $(element).attr('href');
            const appSize = $(element).find('span').text().trim().replace('Downloadfree', '');

            try {
                const downloadPage = await axios.get(downloadUrl);
                const $$ = cheerio.load(downloadPage.data);
                const downloadApp = $$('div.dwn_up.top1 .dwn_btn_wrap a.dwn1').attr('href');

                results.push({
                    appSize,
                    downloadUrl,
                    downloadApp
                });

                // Mengembalikan hasil jika sudah selesai
                if (index === downloadLinks.length - 1) {
                    return results;
                }
            } catch (errorFetch) {
                console.log(errorFetch);
                throw new Error('Error fetching downloadUrl: ' + errorFetch.message);
            }
        }
    } catch (error) {
        console.log(error);
        throw new Error('Error: ' + error.message);
    }
}

// Fungsi untuk pencarian aplikasi
async function apkdogSearch(query) {
    try {
        const searchUrl = `https://apk.dog/search/${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl);
        const $ = cheerio.load(data);
        const results = [];

        const searchResults = $('.search_result_item');
        
        for (let i = 0; i < searchResults.length; i++) {
            const element = searchResults[i];
            const appUrl = $(element).find('a').attr('href');
            const appName = $(element).find('.name').text();
            const appVersion = $(element).find('.version').text();
            const appDate = $(element).find('.date').text();
            const appRating = $(element).find('.rating').text();
            const appIcon = $(element).find('img').attr('src');

            results.push({
                appUrl,
                appName,
                appVersion,
                appDate,
                appRating,
                appIcon
            });
        }

        return results;
    } catch (error) {
        throw new Error('Error searching apps: ' + error.message);
    }
}

// Routing untuk menangani permintaan API
router.get('/', async (req, res) => {
    const { mode, url, query } = req.query;

    if (mode === 'download' && url) {
        try {
            const downloadLinks = await apkdogDownload(url);
            return res.json({
                success: true,
                message: 'Download links retrieved successfully.',
                author: "azatxyz",
                downloadLinks
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                usage: {
                    endpoint: '/api/namafile.js?mode=download&url={appUrl}',
                    method: 'GET',
                    query: { url: 'https://help-out-blocks-game.apk.dog' }
                }
            });
        }
    } else if (mode === 'search' && query) {
        try {
            const searchResults = await apkdogSearch(query);
            return res.json({
                success: true,
                message: 'Pencarian berhasil.',
                author: "azatxyz",
                searchResults
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                usage: {
                    endpoint: '/api/apkdog?mode=search&query={searchQuery}',
                    method: 'GET',
                    query: { query: 'search_term' }
                }
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            message: 'Silakan masukkan parameter yang benar (mode, url, atau query).',
            usage: {
                endpoint: '/api/apkdog?mode=download&url={appUrl}',
                method: 'GET',
                query: { url: 'https://help-out-blocks-game.apk.dog' }
            }
        });
    }
});

module.exports = router;