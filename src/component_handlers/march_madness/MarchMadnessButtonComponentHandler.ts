import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { ButtonInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import {
    sessions,
    InteractiveBracketSession,
    TeamInfo,
    Matchup,
} from '../../commands/march_madness/pickBracket';

export const handler: ComponentHandlerFunction = async (
    _client,
    interaction
) => {
    const match = interaction.customId.match(pattern);
    if (!match) return;
git
    const roundIndex = parseInt(match[1], 10);
    const gameIndex = parseInt(match[2], 10);
    const selectedTeamId = match[3];

    const session: InteractiveBracketSession | undefined = sessions.get(
        interaction.user.id
    );
    if (!session) {
        await interaction.reply({
            content:
                'No active bracket session found. Use /pickbracket to start.',
            ephemeral: true,
        });
        return;
    }

    if (
        roundIndex !== session.currentRound ||
        gameIndex !== session.currentGameIndex
    ) {
        await interaction.reply({
            content: 'This pick is no longer valid.',
            ephemeral: true,
        });
        return;
    }

    const currentMatchup: Matchup =
        session.rounds[session.currentRound][session.currentGameIndex];
    let selectedTeam: TeamInfo | null = null;
    if (currentMatchup.team1.teamId === selectedTeamId) {
        selectedTeam = currentMatchup.team1;
    } else if (currentMatchup.team2.teamId === selectedTeamId) {
        selectedTeam = currentMatchup.team2;
    }
    if (!selectedTeam) {
        await interaction.reply({
            content: 'Invalid team selection.',
            ephemeral: true,
        });
        return;
    }

    session.picks[session.currentRound].push(selectedTeam);
    session.currentGameIndex++;

    await interaction.update({
        content: `You picked **${selectedTeam.displayName}** for Round ${session.currentRound + 1}, Game ${gameIndex + 1}.`,
        components: [],
    });
};

export const pattern: RegExp = /^mm_pick_(\d+)_(\d+)_(.+)$/;

export const shouldLoad = (): boolean => true;
