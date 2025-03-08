const { ExtractorPlugin } = require('distube');
const axios = require('axios');
require('dotenv').config();

class MyCustomExtractor extends ExtractorPlugin {
    constructor() {
        super();
    }

    async resolve(query) {
        if (this.isYouTubeUrl(query)) return { url: query };

        console.log(`🔍 Buscando link para: ${query}`);
        return this.searchYouTubeAPI(query);
    }

    isYouTubeUrl(url) {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
    }

    async searchYouTubeAPI(query) {
        try {
            console.log(`🔍 Buscando na YouTube Data API: ${query}`);
            const apiKey = process.env.YOUTUBE_API_KEY; // Carregar do .env
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=1`;

            const response = await axios.get(url);
            if (!response.data.items || response.data.items.length === 0) {
                throw new Error('Nenhum vídeo encontrado');
            }

            const videoId = response.data.items[0].id.videoId;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`✅ Vídeo encontrado: ${videoUrl}`);

            return { url: videoUrl };
        } catch (error) {
            console.error(`❌ Erro ao buscar vídeo: ${error.message}`);
            throw new Error('Erro ao buscar vídeo.');
        }
    }
}

module.exports = MyCustomExtractor;
