const express = require('express'); const router = express.Router(); const Hls = require('hls.js');

router.tags = ["tools"];

router.get('/', (req, res) => { const { url } = req.query;

if (!url) {
    return res.status(400).json({
        success: false,
        message: "Parameter 'url' diperlukan"
    });
}

const videoPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HLS Stream Player</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #121212;
            color: white;
        }
        video {
            width: 80%;
            max-width: 800px;
            border: 2px solid white;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <video id="video" controls></video>
    <script>
        const video = document.getElementById('video');
        const videoSrc = "${url}";
        
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
            video.addEventListener('loadedmetadata', () => {
                video.play();
            });
        } else {
            alert('HLS tidak didukung di browser ini.');
        }
    </script>
</body>
</html>`;

res.send(videoPage);

});

module.exports = router;

