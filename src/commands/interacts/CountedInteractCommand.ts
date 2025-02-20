import Bot from '../../client/Bot';
import { ChatInputCommandInteraction } from 'discord.js';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import { InteractCommand } from './InteractCommand';

export class CountedInteractCommand extends InteractCommand {
    private readonly commandName: string;
    constructor(
        name: string,
        description: string,
        positiveResponses: string[],
        negativeResponses: string[],
        chanceForNegativeResponse: number
    ) {
        super(name, description, positiveResponses, negativeResponses, chanceForNegativeResponse);
        this.commandName = name;
        this.handler = async (client: Bot, interaction: ChatInputCommandInteraction) => {
            const userId = interaction.user.id;
            let newCount = 0;
            try {
                await client.database.getCommandUsageStats(userId, this.commandName)
                    .then(async (usage) => {
                        usage.count++;
                        await usage.save();
                        newCount = usage.count;
                    });
            } catch (error) {
                console.error('Error updating command usage count:', error);
            }
            const ordinal = this.appendSuffixToOrdinal(newCount);
            const response = this.generateResponse(ordinal);
            await getSafeReplyFunction(client, interaction)({ content: response });
        };
    }

    private generateResponse(ordinal: string): string {
        const useNegative = Math.random() <= this.chanceForNegativeResponse;
        const responses = useNegative ? this.negativeResponses : this.positiveResponses;
        const response = responses[Math.floor(Math.random() * responses.length)];
        return response.includes('{ordinal}') ? response.replace('{ordinal}', ordinal) : response;
    }

    private appendSuffixToOrdinal(i: number): string {
        const last_digit = i % 10;
        const last_two_digits = i % 100;
        if (last_digit === 1 && last_two_digits !== 11) {
            return i + "st";
        }
        if (last_digit === 2 && last_two_digits !== 12) {
            return i + "nd";
        }
        if (last_digit === 3 && last_two_digits !== 13) {
            return i + "rd";
        }
        return i + "th";
    }
}

export const shouldLoad = () => false;
