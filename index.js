const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const path = require('path');
const express = require('express');
require('dotenv').config();

// Caminho do FFmpeg (ajuste conforme necessário)
const ffmpegPath = process.platform === 'win32'
    ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' // Caminho no Windows
    : require('ffmpeg-static').path || '/usr/bin/ffmpeg'; // Caminho no Linux/Docker

const token = process.env.DISCORD_TOKEN;

// Cria uma nova instância do cliente
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Coleções para comandos
client.commands = new Collection();
client.aliases = new Collection();
client.slashCommands = new Collection();

// Registra comandos dinamicamente
const loadCommands = require('./registers/commands-register');
loadCommands(client);

// Configura o DisTube
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YtDlpPlugin()],
    ffmpeg: { path: ffmpegPath },
});

// Evento de erro do DisTube
client.distube.on('error', (channel, error) => {
    console.error(`Erro de DisTube: ${error.message}`);
    channel.send('Ocorreu um erro ao reproduzir o vídeo. Verifique o link e tente novamente.');
});

// Evento de inicialização do bot
client.once('ready', () => {
    console.log(`Bot pronto! Logado como ${client.user.tag}`);
});

// Função para encontrar todos os canais #music
const findMusicChannels = () => {
    const musicChannels = [];
    client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.find(
            ch => ch.name === 'music' && ch.isTextBased()
        );
        if (channel) {
            musicChannels.push(channel);
        }
    });
    return musicChannels;
};

// Função para encontrar o canal de voz com mais pessoas
const findVoiceChannelWithMostMembers = (guild) => {
    const voiceChannels = guild.channels.cache.filter(ch => ch.isVoiceBased());
    let targetChannel = null;
    let maxMembers = 0;

    voiceChannels.forEach(channel => {
        if (channel.members.size > maxMembers) {
            maxMembers = channel.members.size;
            targetChannel = channel;
        }
    });

    return targetChannel;
};

// Comando de menção
const mentionCommand = require('./commands/mention');

client.on('messageCreate', async (message) => {
    const prefix = "'";

    // Ignora mensagens de outros bots, mas permite que o bot leia suas próprias mensagens
    if (message.author.bot && message.author.id !== client.user.id) return;

    // Comando de menção
    if (message.mentions.has(client.user)) {
        try {
            await mentionCommand.execute(message, client);
        } catch (e) {
            console.error(e);
            message.channel.send(`Erro ao executar o comando: \`${e.message}\``);
        }
        return;
    }

    // Comandos prefixados
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandTyped = args.shift().toLowerCase();

    const cmd = client.commands.get(commandTyped) || client.commands.get(client.aliases.get(commandTyped));
    if (!cmd) return;

    if (cmd.inVoiceChannel && !message.member.voice.channel) {
        return message.channel.send('Você deve estar em um canal de voz!');
    }

    try {
        await cmd.execute(message, client, args);
    } catch (e) {
        console.error(e);
        message.channel.send(`Erro: \`${e.message}\``);
    }
});

// Comandos de barra (slash commands)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: 'Erro ao executar o comando!', ephemeral: true });
    }
});

// Login do bot
client.login(token);

// Servidor Express para a página de gerenciamento
const app = express();
app.use(express.json()); // Para processar JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para obter o status do bot
app.get('/status', (req, res) => {
    res.json({ status: client.readyAt ? 'Online' : 'Offline' });
});

// Rota para executar o comando play
app.post('/execute/play', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ message: 'Nenhuma consulta fornecida.' });
    }

    try {
        const musicChannels = findMusicChannels();
        if (musicChannels.length === 0) {
            return res.status(404).json({ message: 'Nenhum canal #music encontrado.' });
        }

        // Encontra o canal de voz com mais pessoas
        const guild = musicChannels[0].guild; // Usa o servidor do primeiro canal #music encontrado
        const voiceChannel = findVoiceChannelWithMostMembers(guild);

        if (!voiceChannel) {
            return res.status(404).json({ message: 'Nenhum canal de voz com membros encontrado.' });
        }

        // Entra no canal de voz usando o DisTube
        await client.distube.voices.join(voiceChannel);

        // Executa o comando play no canal #music
        for (const channel of musicChannels) {
            await channel.send(`'play ${query}`); // Usa o prefixo correto
        }

        res.json({ message: `Comando play executado com a consulta: ${query}` });
    } catch (error) {
        console.error('Erro ao executar o comando play:', error);
        res.status(500).json({ message: `Erro ao executar o comando play: ${error.message}` });
    }
});

// Rota para executar o comando pause
app.post('/execute/pause', async (req, res) => {
    try {
        const musicChannels = findMusicChannels();
        if (musicChannels.length === 0) {
            return res.status(404).json({ message: 'Nenhum canal #music encontrado.' });
        }

        // Executa o comando pause no canal #music
        for (const channel of musicChannels) {
            await channel.send(`'pause`); // Usa o prefixo correto
        }

        res.json({ message: 'Comando pause executado.' });
    } catch (error) {
        console.error('Erro ao executar o comando pause:', error);
        res.status(500).json({ message: `Erro ao executar o comando pause: ${error.message}` });
    }
});

// Rota para executar o comando resume
app.post('/execute/stop', async (req, res) => {
    try {
        const musicChannels = findMusicChannels();
        if (musicChannels.length === 0) {
            return res.status(404).json({ message: 'Nenhum canal #music encontrado.' });
        }

        // Executa o comando stop no canal #music
        for (const channel of musicChannels) {
            await channel.send(`'resume`); // Usa o prefixo correto
        }

        res.json({ message: 'Comando resume executado.' });
    } catch (error) {
        console.error('Erro ao executar o comando resume:', error);
        res.status(500).json({ message: `Erro ao executar o comando resume: ${error.message}` });
    }
});

/*  // Inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de gerenciamento rodando em http://localhost:${PORT}`);
});
*/


