const fs = require('fs');
const path = require('path');

// Define o caminho para o arquivo JSON contendo as frases
const phrasesPath = path.join(__dirname, 'data', 'phrases.json');

// Lê o conteúdo do arquivo JSON com verificação de erros
let phrases = [];
try {
    phrases = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
} catch (error) {
    console.error('Erro ao ler o arquivo phrases.json:', error);
}

module.exports = {
    name: 'talk',
    description: 'Marca uma pessoa aleatória e envia 5 frases aleatórias com intervalo aleatório entre as mensagens',
    aliases: ['t'],
    async execute(message, client, args) {
        // Função para enviar uma mensagem com uma frase aleatória
        const sendMessage = async (index) => {
            if (index >= 5) return; // Para quando 5 mensagens forem enviadas

            // Obtém os membros do servidor
            const members = message.guild.members.cache.filter(member => !member.user.bot); // Exclui bots
            if (members.size === 0) return;

            // Escolhe um membro aleatório
            const randomMember = members.random();
            
            // Escolhe uma frase aleatória
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

            // Envia a mensagem mencionando o usuário aleatório
            await message.channel.send(`${randomMember} ${randomPhrase}`);

            // Define um intervalo aleatório entre 1 e 5 minutos (em milissegundos)
            const randomDelay = Math.floor(Math.random() * (5 * 60 * 1000 - 1 * 60 * 1000 + 1)) + 1 * 60 * 1000;

            // Aguarda o intervalo aleatório antes de enviar a próxima mensagem
            setTimeout(() => sendMessage(index + 1), randomDelay);
        };

        // Executa a função de envio de mensagens automaticamente quando o bot iniciar
        client.on('ready', () => {
            console.log(`${client.user.tag} está online!`);
            sendMessage(0);
        });
    },
};
