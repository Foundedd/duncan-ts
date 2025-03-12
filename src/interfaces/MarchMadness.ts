export interface Team {
    displayName: string;
    teamId: string;
    record: string;
    // other stats
}

export interface bracketPick {
    winner: Team;
}

export interface Round {
    roundNumber: number;
    picks: bracketPick[];
}

export interface Bracket {
    userId: string;
    rounds: Round[];
}
