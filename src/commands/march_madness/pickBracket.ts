import { SlashCommandBuilder } from '@discordjs/builders';
import {
    ChatInputCommandInteraction,
    ButtonInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

import { Bracket } from '../../database/models/Bracket';
import { Round } from '../../database/models/Round';
import { Pick } from '../../database/models/Pick';

// Todo: seed also good
export interface TeamInfo {
    teamId: string;
    displayName: string;
    record: string;
}

export interface Matchup {
    gameId: number;
    team1: TeamInfo;
    team2: TeamInfo;
}

export interface InteractiveBracketSession {
    userId: string;
    rounds: Matchup[][];
    picks: TeamInfo[][];
    currentRound: number;
    currentGameIndex: number;
}

// ToDo: how do we get these in here? also get full details from API
const firstRoundMatchups: Matchup[] = [
    {
        gameId: 1,
        team1: { teamId: 'duke', displayName: 'Duke', record: '25-5' },
        team2: { teamId: 'unc', displayName: 'UNC', record: '24-6' },
    },
    {
        gameId: 2,
        team1: { teamId: 'kentucky', displayName: 'Kentucky', record: '26-4' },
        team2: { teamId: 'kansas', displayName: 'Kansas', record: '27-3' },
    },
];

export const sessions = new Map<string, InteractiveBracketSession>();

export const builder = new SlashCommandBuilder()
    .setName('pickbracket')
    .setDescription('make picc');

export const handler: CommandHandler = async (
    client: Bot,
    interaction: ChatInputCommandInteraction
): Promise<void> => {
    const safeReply = getSafeReplyFunction(client, interaction);

    if (sessions.has(interaction.user.id)) {
        await safeReply({
            content: 'You already have an active bracket session!',
            ephemeral: true,
        });
        return;
    }

    const session: InteractiveBracketSession = {
        userId: interaction.user.id,
        rounds: [firstRoundMatchups],
        picks: [[]],
        currentRound: 0,
        currentGameIndex: 0,
    };

    sessions.set(interaction.user.id, session);

    await sendCurrentMatchup(interaction);
};

async function sendCurrentMatchup(
    interaction: ChatInputCommandInteraction | ButtonInteraction
): Promise<void> {
    const session = sessions.get(interaction.user.id);
    if (!session) return;

    const currentRoundMatchups = session.rounds[session.currentRound];

    if (session.currentGameIndex < currentRoundMatchups.length) {
        const matchup = currentRoundMatchups[session.currentGameIndex];
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `mm_pick_${session.currentRound}_${session.currentGameIndex}_${matchup.team1.teamId}`
                )
                .setLabel(matchup.team1.displayName)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(
                    `mm_pick_${session.currentRound}_${session.currentGameIndex}_${matchup.team2.teamId}`
                )
                .setLabel(matchup.team2.displayName)
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
            content: `Round ${session.currentRound + 1}, Game ${session.currentGameIndex + 1}: ${matchup.team1.displayName} (${matchup.team1.record}) vs. ${matchup.team2.displayName} (${matchup.team2.record}). Choose your winner:`,
            components: [row],
            ephemeral: true,
        });
        return;
    }

    const currentRoundPicks = session.picks[session.currentRound];
    if (currentRoundPicks.length === 0) {
        await interaction.reply({
            content: 'Error: No picks recorded for the current round.',
            ephemeral: true,
        });
        return;
    }

    if (currentRoundPicks.length === 1) {
        try {
            await Bracket.create({ userId: session.userId } as any);
            for (let round = 0; round < session.rounds.length; round++) {
                const roundRecord = await Round.create({
                    bracketUserId: session.userId,
                    roundNumber: round + 1,
                } as any);
                for (const pick of session.picks[round]) {
                    await Pick.create({
                        roundId: roundRecord.id,
                        teamId: pick.teamId,
                    } as any);
                }
            }
            sessions.delete(session.userId);
            await interaction.reply({
                content: 'submitted',
                ephemeral: true,
            });
        } catch (error) {
            await interaction.reply({
                content: `error: ${error}`,
                ephemeral: true,
            });
        }
        return;
    }

    const winners = session.picks[session.currentRound];
    const nextRoundMatchups: Matchup[] = [];
    for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
            nextRoundMatchups.push({
                gameId: i / 2 + 1,
                team1: winners[i],
                team2: winners[i + 1],
            });
        }
    }

    session.rounds.push(nextRoundMatchups);
    session.picks.push([]);
    session.currentRound++;
    session.currentGameIndex = 0;

    await sendCurrentMatchup(interaction);
}

export const guildOnly = (_interaction: ChatInputCommandInteraction): boolean =>
    true;
export const permissions = (
    _interaction: ChatInputCommandInteraction
): boolean => false;
export const shouldLoad = (): boolean => true;
