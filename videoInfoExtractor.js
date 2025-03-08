const axios = require('axios');
require('dotenv').config();

class VideoInfoExtractor {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
    }

    async fetchVideoInfo(videoUrl) {
        console.log(`Buscando informações para: ${videoUrl}`);

        const videoId = this.getVideoId(videoUrl);
        if (!videoId) throw new Error('URL inválida.');

        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: this.apiKey,
                    part: 'snippet,contentDetails',
                    id: videoId,
                },
                timeout: 5000,
            });

            const video = response.data.items[0];
            if (!video) throw new Error('Vídeo não encontrado.');

            return {
                title: video.snippet.title,
                artist: video.snippet.channelTitle,
                url: videoUrl,
                thumbnail: video.snippet.thumbnails.default.url,
                duration: this.parseDuration(video.contentDetails.duration),
            };
        } catch (error) {
            console.error(`Erro ao buscar informações do vídeo: ${error.message}`);
            throw new Error('Erro ao buscar informações do vídeo.');
        }
    }

    getVideoId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        return match ? match[1] : null;
    }

    parseDuration(duration) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);
        return hours * 3600 + minutes * 60 + seconds;
    }
}

module.exports = VideoInfoExtractor;
