import 'dotenv/config';

import {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes
} from 'discord.js';

import submit from './commands/submit.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.commands = new Collection();

const commands = [
    submit
];

for (const command of commands) {
    client.commands.set(command.data.name, command);
}

const rest = new REST({
    version: '10'
}).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    try {
        console.log('📰 Registering global commands...');

        await rest.put(
            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),
            {
                body: commands.map(command =>
                    command.data.toJSON()
                )
            }
        );

        console.log('✅ Global commands registered!');
    } catch (error) {
        console.error(
            '❌ Failed to register commands:',
            error
        );
    }
}

client.once('ready', () => {
    console.log('');
    console.log('════════════════════════════════');
    console.log('         GOTHAM GAZETTE');
    console.log('════════════════════════════════');
    console.log(`Bot: ${client.user.tag}`);
    console.log(`Servers: ${client.guilds.cache.size}`);
    console.log('News System: ONLINE');
    console.log('AI System: ONLINE');
    console.log('Newspaper Renderer: ONLINE');
    console.log('════════════════════════════════');
});

client.on('guildCreate', guild => {
    console.log(
        `➕ Joined server: ${guild.name}`
    );
});

client.on('guildDelete', guild => {
    console.log(
        `➖ Left server: ${guild.name}`
    );
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command =
        client.commands.get(
            interaction.commandName
        );

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        const message = {
            content:
                '❌ The newsroom encountered an unexpected error.',
            ephemeral: true
        };

        if (
            interaction.replied ||
            interaction.deferred
        ) {
            await interaction.editReply(message);
        } else {
            await interaction.reply(message);
        }
    }
});

await registerCommands();

client.login(
    process.env.DISCORD_TOKEN
);
