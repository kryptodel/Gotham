import {
    SlashCommandBuilder,
    AttachmentBuilder
} from 'discord.js';

import { generateNews } from '../services/ai.js';
import { generateNewspaper } from '../services/newspaper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit an event to be turned into a Gotham Gazette article.')

        .addStringOption(option =>
            option
                .setName('event')
                .setDescription('What happened?')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('location')
                .setDescription('Where did it happen?')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('involved')
                .setDescription('Who was involved?')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('details')
                .setDescription('Provide the details of the event.')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const event = interaction.options.getString('event');
            const location = interaction.options.getString('location');
            const involved = interaction.options.getString('involved');
            const details = interaction.options.getString('details');

            const news = await generateNews({
                event,
                location,
                involved,
                details
            });

            const newspaper = await generateNewspaper(news);

            const attachment = new AttachmentBuilder(newspaper, {
                name: 'gotham-gazette.png'
            });

            await interaction.editReply({
                content: '📰 **News created successfully!**\n\nHere is the article from **The Gotham Gazette**:',
                files: [attachment]
            });

        } catch (error) {
            console.error('Submit command error:', error);

            await interaction.editReply({
                content: '❌ An error occurred while generating the news. Please try again!'
            });
        }
    }
};
