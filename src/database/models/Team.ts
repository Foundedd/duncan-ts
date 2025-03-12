import {
    Table,
    Column,
    Model,
    PrimaryKey,
    DataType,
    HasMany,
} from 'sequelize-typescript';
import { Pick } from './Pick';

export interface TeamAttributes {
    teamId: string;
    displayName: string;
    record: string;
}

export interface TeamCreationAttributes extends TeamAttributes {}

@Table({ tableName: 'teams' })
export class Team
    extends Model<TeamAttributes, TeamCreationAttributes>
    implements TeamAttributes
{
    @PrimaryKey
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    teamId!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    displayName!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    record!: string;

    @HasMany(() => Pick)
    picks!: Pick[];
}
