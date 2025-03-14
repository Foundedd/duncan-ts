import { exit } from 'process';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import {
    getInteractionCountMigrationGuild,
    getInteractionCountMigrationLastMessageMap,
    setInteractionCountMigrationLastMessageMap,
} from '../../utils/MigrationUtils';
import { getAllMessagesInChannel } from '../../utils/MessageUtils';
import { DiscordAPIError, TextBasedChannel } from 'discord.js';

const COUNTED_INTERACT_COMMANDS_DATABASE_VERSION = 1;
const INTERACT_COMMAND_NAMES = ['chomp', 'hug', 'lick', 'pet'];
const FIRST_INTERACT_COMMAND_DATE = new Date(2022, 1, 26);

function exitMigrationFailure(
    client: Bot,
    databaseVersion: number,
    reason: string
): never {
    client.logger?.error(`Can't run migration ${databaseVersion}: ${reason}`);
    exit(1);
}

function isInteractCommand(commandName: string) {
    return (
        INTERACT_COMMAND_NAMES.find(
            (interactCommandName) => interactCommandName == commandName
        ) != undefined
    );
}

async function countAllExistingInteractCommandsInChannel(
    channel: TextBasedChannel,
    client: Bot,
    lastMessageMap: Map<string, string>
) {
    for await (const message of getAllMessagesInChannel(
        channel,
        lastMessageMap.get(channel.id)
    )) {
        if (message.createdAt < FIRST_INTERACT_COMMAND_DATE) {
            break;
        }
        lastMessageMap.set(channel.id, message.id);
        if (
            message.interaction &&
            isInteractCommand(message.interaction.commandName) &&
            message.author.id == client.user!.id
        ) {
            client.logger?.info(
                `Counted interact commands migration found interaction by ${message.interaction.user.displayName}, command name ${message.interaction.commandName}, at ${message.createdAt} on message id ${message.id}`
            );
            await client.database.createCommandUsageIfDoesntExist(
                message.interaction.user.id,
                message.interaction.commandName,
                message.createdAt
            );
        } else if (message.thread) {
            client.logger?.info(
                `Found thread creation of thread ${message.thread.name} in message ${message.id}, going in`
            );
            await countAllExistingInteractCommandsInChannel(
                message.thread,
                client,
                lastMessageMap
            );
            client.logger?.info(
                `Done with thread ${message.thread.name} in message ${message.id}`
            );
        }
    }
}

async function countAllExistingInteractCommands(client: Bot) {
    const guildId = getInteractionCountMigrationGuild();
    if (!guildId) {
        exitMigrationFailure(
            client,
            COUNTED_INTERACT_COMMANDS_DATABASE_VERSION,
            'missing guild id for counted interact commands migration'
        );
    }
    const guild = await client.guilds.fetch(guildId).catch(() => undefined);
    if (!guild) {
        exitMigrationFailure(
            client,
            COUNTED_INTERACT_COMMANDS_DATABASE_VERSION,
            'missing guild id for counted interact commands migration'
        );
    }
    const channels = await guild.channels.fetch();
    const bot = await guild.members.fetchMe();
    const lastMessageMap = getInteractionCountMigrationLastMessageMap();
    for (let [id, channel] of channels) {
        if (!channel) {
            client.logger?.info(
                `Counted interact commands migration skipping channel ${id} (Was not resolved)`
            );
            continue;
        }
        if (!channel.isTextBased()) {
            client.logger?.info(
                `Counted interact commands migration skipping channel ${channel.name} (${id}) (Not text based)`
            );
            continue;
        }
        const missingPermissions = channel
            .permissionsFor(bot)
            .missing(['ViewChannel', 'ReadMessageHistory']);
        if (missingPermissions.length !== 0) {
            client.logger?.info(
                `Counted interact commands migration skipping channel ${channel.name} (${id}) (missing permissions ${missingPermissions})`
            );
            continue;
        }
        client.logger?.info(
            `Counted interact commands migration running on channel ${channel.name} (${id})`
        );
        try {
            await countAllExistingInteractCommandsInChannel(
                channel,
                client,
                lastMessageMap
            );
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code == 50001) {
                client.logger?.info(
                    `Got known error while trying to scan through channel ${channel.name} (${id}) (${error})`
                );
                continue;
            }
            setInteractionCountMigrationLastMessageMap(lastMessageMap);
            throw error;
        }
        client.logger?.info(
            `Counted interact commands migration done running on channel ${channel.name} (${id})`
        );
        setInteractionCountMigrationLastMessageMap(lastMessageMap);
    }
    client.logger?.info(`Counted interact commands migration finished`);
}

async function tryCountAllExistingInteractCommands(client: Bot) {
    try {
        await countAllExistingInteractCommands(client);
    } catch (error) {
        exitMigrationFailure(
            client,
            COUNTED_INTERACT_COMMANDS_DATABASE_VERSION,
            `got unknown error: ${error}`
        );
    }
}

async function tryToRunMigrations(client: Bot) {
    const initialDatabaseVersion = await client.database.getDatabaseVersion();
    let databaseVersion = initialDatabaseVersion;
    client.logger?.debug(`Database version is ${databaseVersion}`);
    if (databaseVersion < COUNTED_INTERACT_COMMANDS_DATABASE_VERSION) {
        await tryCountAllExistingInteractCommands(client);
        databaseVersion = COUNTED_INTERACT_COMMANDS_DATABASE_VERSION;
    }
    if (initialDatabaseVersion != databaseVersion) {
        await client.database.setDatabaseVersion(databaseVersion);
    }
}

export const name: string = 'ready';
export const handler: EventHandler = async (client: Bot) => {
    try {
        await tryToRunMigrations(client);
    } catch (error) {
        exitMigrationFailure(client, -1, `unknown migration error: ${error}`);
    }
};
export const once: boolean = true;
export const shouldLoad = () => true;
