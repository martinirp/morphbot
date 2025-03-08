const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const OUTPUT_FILE = path.join(__dirname, '../playlist.json');

const playlistUtils = {
  extractPlaylistId: (url) => {
    const regex = /list=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  },

  fetchPlaylistData: async (playlistId) => {
    let nextPageToken = null;
    let videos = [];
    let playlistTitle = '';
    let totalVideos = 0;

    do {
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

    } while (nextPageToken);

    return {
      title: playlistTitle,
      videoCount: totalVideos,
      videos
    };
  },

  savePlaylist: (data) => {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  }
};

async function handlePlaylist(PLAYLIST_URL) {
  try {
    if (!API_KEY) throw new Error('YouTube API Key não encontrada no .env');
    const playlistId = playlistUtils.extractPlaylistId(PLAYLIST_URL);
    if (!playlistId) throw new Error('URL da playlist inválida');

    const playlistData = await playlistUtils.fetchPlaylistData(playlistId);
    const formattedData = {
      playlistId,
      title: playlistData.title,
      videoCount: playlistData.videoCount,
      videos: playlistData.videos
    };

    playlistUtils.savePlaylist(formattedData);
    return formattedData;

  } catch (error) {
    console.error('Erro no handler de playlist:', error.message);
    throw error;
  }
}

module.exports = {
  handlePlaylist,
  playlistUtils
};