import {
    Table,
    Column,
    Model,
    PrimaryKey,
    AutoIncrement,
    DataType,
    ForeignKey,
    BelongsTo,
    HasMany,
} from 'sequelize-typescript';
import { Bracket } from './Bracket';
import { Pick } from './Pick';
import { Optional } from 'sequelize';

export interface RoundAttributes {
    id: number;
    bracketUserId: string;
    roundNumber: number;
}

export interface RoundCreationAttributes
    extends Optional<RoundAttributes, 'id'> {}

@Table({ tableName: 'rounds' })
export class Round
    extends Model<RoundAttributes, RoundCreationAttributes>
    implements RoundAttributes
{
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @ForeignKey(() => Bracket)
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    bracketUserId!: string;

    @BelongsTo(() => Bracket)
    bracket!: Bracket;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    roundNumber!: number;

    @HasMany(() => Pick)
    picks!: Pick[];
}
