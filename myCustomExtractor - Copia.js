const { ExtractorPlugin } = require('distube');
const axios = require('axios');
require('dotenv').config();

class MyCustomExtractor extends ExtractorPlugin {
    constructor() {
        super();
        this.apiKey = process.env.YOUTUBE_API_KEY;
    }

    async resolve(query) {
        if (this.isYouTubeUrl(query)) return { url: query }; // Retorna imediatamente se for link

        console.log(`🔍 Buscando link para: ${query}`);
        return this.search(query);
    }

    isYouTubeUrl(url) {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
    }

    async search(query) {
        try {
            const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    key: this.apiKey,
                    part: 'id',
                    q: query,
                    type: 'video',
                    maxResults: 1,
                },
                timeout: 3000, // Reduz o tempo limite para respostas mais rápidas
            });

            const videoId = data.items?.[0]?.id?.videoId;
            if (!videoId) throw new Error('Nenhum vídeo encontrado');

            return { url: `https://www.youtube.com/watch?v=${videoId}` };
        } catch (error) {
            console.error(`❌ Erro ao buscar vídeo: ${error.message}`);
            throw new Error('Erro ao buscar vídeo.');
        }
    }
}

module.exports = MyCustomExtractor;
