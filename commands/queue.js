module.exports = {
	name: 'queue',
	description: 'lista a playlist atual',
	aliases: ['q'],
	execute: async (message, client) => {
	  const queue = client.distube.getQueue(message);
	  if (!queue) {
		return message.channel.send(
		  'Não tem nada sendo reproduzido no momento!'
		);
	  }
  
	  // Exibir a fila no canal com nome e duração
	  const q = queue.songs
		.map(
		  (song, i) =>
			`${i === 0 ? 'Playing:' : `${i}.`} ${song.name} - \`${
			  song.formattedDuration
			}\``
		)
		.join('\n');
	  message.channel.send(`**Server Queue**\n${q}`);
	},
  };
  