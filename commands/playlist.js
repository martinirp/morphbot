const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.YOUTUBE_API_KEY;

module.exports = {
  name: 'playlist',
  description: 'Toca uma playlist do YouTube',
  inVoiceChannel: true,
  async execute(message, client, args) {
    console.log('🔹 Comando "playlist" iniciado.');

    const playlistUrl = args[0];
    if (!playlistUrl) {
      return message.reply('🎵 Por favor, forneça o link de uma playlist do YouTube!');
    }

    // Verifica se o usuário está em um canal de voz
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ Você precisa estar em um canal de voz para tocar uma playlist!');
    }

    console.log('🔹 Usuário está em um canal de voz:', voiceChannel.name);

    // Função para extrair o ID da playlist da URL
    const extractPlaylistId = (url) => {
      const regex = /list=([a-zA-Z0-9_-]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return message.reply('❌ URL da playlist inválida!');
    }

    console.log('🔹 ID da playlist extraído:', playlistId);

    // Função para buscar os dados da playlist usando a API do YouTube
    const fetchPlaylistData = async (playlistId) => {
      let nextPageToken = null;
      let videos = [];
      let playlistTitle = '';
      let totalVideos = 0;
      let attempts = 0; // Para evitar loop infinito

      do {
        attempts++;
        if (attempts > 3) { // Se tentar mais de 3 vezes, aborta
          console.error('❌ Loop detectado! Interrompendo busca de vídeos.');
          return message.reply('❌ Não identifiquei a Playlist! Tente Novamente!');
          break;
        }

        console.log(`🔹 Tentativa #${attempts} - Buscando vídeos...`);

        try {
          const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
            params: {
              part: 'snippet',
              playlistId,
              maxResults: 50,
              key: API_KEY,
              pageToken: nextPageToken || undefined
            }
          });

          const data = response.data;
          if (data){
            console.log(`🔹 API Response: OK `); // Log do JSON completo
          };
          

          if (!data.items || data.items.length === 0) {
            console.log('⚠️ Nenhum vídeo encontrado na playlist.');
            break;
          }

          nextPageToken = data.nextPageToken;

          if (!playlistTitle && data.items.length > 0) {
            playlistTitle = data.items[0].snippet.title;
          }

          data.items.forEach(item => {
            if (item.snippet.resourceId.kind === 'youtube#video') {
              videos.push({
                title: item.snippet.title,
                videoId: item.snippet.resourceId.videoId,
                url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                position: item.snippet.position + 1
              });
            }
          });

          totalVideos = data.pageInfo.totalResults;
        } catch (error) {
          console.error('❌ Erro na requisição à API do YouTube:', error.response?.data || error.message);
          break;
        }
      } while (nextPageToken);

      console.log(`🔹 Playlist carregada: ${playlistTitle} - ${videos.length} vídeos encontrados.`);

      return {
        title: playlistTitle,
        videoCount: totalVideos,
        videos
      };
    };

    try {
      const playlistData = await fetchPlaylistData(playlistId);

      if (!playlistData.videos.length) {
        return message.reply('❌ A playlist não contém vídeos válidos.');
      }

      await message.reply(`🎶 Playlist **${playlistData.title}** foi carregada com sucesso!`);

      for (const { url, title, position } of playlistData.videos) {
        if (!url) continue;

        try {
          console.log(`🎵 Tocando música: ${title} (${url})`);
          await client.commands.get('play-link').execute(message, client, [url]);

          await message.reply(`🎵 **Tocando:** ${title}  
🔗 [Ouvir agora](${url})  
🎬 **Posição na playlist:** ${position}`);
        } catch (error) {
          console.error(`Erro ao tocar a música "${title}":`, error);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao buscar dados da playlist:', error);
      return message.reply('❌ Ocorreu um erro ao processar sua playlist. Tente novamente!');
    }
  },
};
