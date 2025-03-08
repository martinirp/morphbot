const { Client, Message } = require('discord.js');
const MyCustomExtractor = require('../myCustomExtractor');
const playlistCommand = require('./playlist');

module.exports = {
    name: 'play',
    description: 'Toca uma música do YouTube',
    aliases: ['p'],
    inVoiceChannel: true,
    execute: async (message, client, args) => {
        try {
            const string = args.join(' ');

            if (!string) {
                return message.channel.send('🎵 Por favor, me diga o nome da música ou cole o link!');
            }

            if (!message.member.voice.channel) {
                return message.channel.send('❌ Você precisa estar em um canal de voz para usar este comando!');
            }

            if (string.includes('list=')) {
                console.log('🔹 Playlist detectada. Executando comando de playlist...');
                return playlistCommand.execute(message, client, [string]);
            }

            const extractor = new MyCustomExtractor();
            const { url } = await extractor.resolve(string);

            if (!url) {
                return message.channel.send('❌ Música não encontrada!');
            }

            console.log(`🎶 Tocando: ${url}`);

            // **Inicia a reprodução imediatamente**
            client.distube.play(message.member.voice.channel, url, {
                member: message.member,
                textChannel: message.channel,
                message,
            }).then(() => {
                console.log('🎵 Música começou a tocar! Salvando na biblioteca...');

                const saveCommand = client.commands.get('save');
                if (saveCommand) {
                    saveCommand.execute(message, client, [url])
                        .then(() => console.log('✅ Música salva na biblioteca!'))
                        .catch(err => console.error('❌ Erro ao salvar música:', err));
                }
            }).catch(error => {
                console.error('Erro ao iniciar reprodução:', error);
                message.channel.send('❌ Erro ao tentar tocar a música.');
            });

            message.channel.send(`🎵 **Tocando agora:** ${url}`);

        } catch (error) {
            console.error('Erro no comando play:', error);
            return message.channel.send('❌ Erro ao reproduzir a música. Detalhes no console.');
        }
    },
};
