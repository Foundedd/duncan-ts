import Conf from 'conf';
import { GuildMember } from 'discord.js';
import Bot from '../client/Bot';

const REGEX_CHARACTERS = /[\\^$.*+?()[\]{}|]/g;

const config = new Conf();

export function getEnabled(): boolean {
    const enabled = config.get('wordfield.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

export function getRole(): string {
    const role = config.get('wordfield.role');
    return typeof role === 'string' ? role : '0';
}

export function setRole(role: string) {
    config.set('wordfield.role', role);
}

export function getGuild(): string {
    const guild = config.get('wordfield.guild');
    return typeof guild === 'string' ? guild : '0';
}

export function setGuild(guild: string) {
    config.set('wordfield.guild', guild);
}

export function getBannedWordsList(): string[] {
    const list = config.get('wordfield.banned_words');
    return Array.isArray(list) ? list : [];
}

export function setBannedWordsList(list: string[]) {
    config.set('wordfield.banned_words', list);
}

export function getIgnoredChannelsList(): string[] {
    const list = config.get('wordfield.ignored_channels');
    return Array.isArray(list) ? list : [];
}

export function setIgnoredChannelsList(list: string[]) {
    config.set('wordfield.ignored_channels', list);
}

function escapeRegex(input: string): string {
    return input.replace(REGEX_CHARACTERS, '\\$&');
}

export function getBannedWordsRegex(): RegExp {
    return new RegExp(
        '\\b(' + getBannedWordsList().map(escapeRegex).join('|') + ')\\b'
    );
}

export function isMemberParticipatingInWordfield(member: GuildMember): boolean {
    return member.roles.cache.has(getRole());
}

export async function getUsersWithWordfieldRole(
    client: Bot
): Promise<GuildMember[]> {
    const role = getRole();
    if (role === '0') {
        return [];
    }
    const guild = getGuild();
    if (guild === '0') {
        return [];
    }
    const guildObj = await client.guilds.fetch(guild).catch(() => undefined);
    if (!guildObj) {
        return [];
    }
    return guildObj.members
        .fetch()
        .then((members) =>
            members.filter((member) => member.roles.cache.has(role))
        )
        .then((members) => Array.from(members.values()))
        .catch((error) => {
            client.logger?.error(
                `Failed to fetch members with role ${role}, error: ${error}`
            );
            return [];
        });
}
