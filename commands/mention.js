const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const filePath = path.join(__dirname, '..', 'data', 'links.json');

module.exports = {
    name: 'mention',
    description: 'Faz um mix de 10 músicas armazenadas na biblioteca',
    async execute(message, client) {
        if (!fs.existsSync(filePath)) {
            return message.reply('Nenhuma música foi salva ainda. 😕');
        }

        let links = [];

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            links = JSON.parse(data);
            if (!Array.isArray(links) || links.length === 0) {
                return message.reply('A biblioteca de músicas está vazia! 🎶');
            }
        } catch (error) {
            console.error(`Erro ao ler o arquivo JSON: ${error}`);
            return message.reply('Erro ao acessar a biblioteca de músicas. 🚨');
        }

        // Embaralhar os links para melhor aleatoriedade
        const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
        const shuffledLinks = shuffleArray(links).slice(0, 10); // Pega 10 músicas aleatórias

        for (const { link, user, date, NAME, ARTIST } of shuffledLinks) {
            if (!link) continue; // Pula se o link for inválido

            const formattedDate = format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR });

            try {
                await client.commands.get('play-link').execute(message, client, [link]);

                const responseMessage = `🎵 **Tocando música aleatória:**  
🎶 **${NAME}** - *${ARTIST}*  
🔗 [Ouvir agora](${link})  

👤 **Escolhido por:** ${user}  
📅 **Adicionado em:** ${formattedDate}`;
                
                await message.reply(responseMessage); // Agora responde diretamente ao usuário

                console.log(`🎵 Tocando: ${NAME} - ${ARTIST} | Adicionado por ${user} em ${formattedDate}`);
            } catch (error) {
                console.error(`Erro ao executar o comando play-link: ${error}`);
            }
        }
    },
};
