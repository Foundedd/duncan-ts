import {
    Table,
    Column,
    Model,
    PrimaryKey,
    AutoIncrement,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { Round } from './Round';
import { Team } from './Team';
import { Optional } from 'sequelize';

export interface PickAttributes {
    id: number;
    roundId: number;
    teamId: string;
}

export interface PickCreationAttributes
    extends Optional<PickAttributes, 'id'> {}

@Table({ tableName: 'picks' })
export class Pick
    extends Model<PickAttributes, PickCreationAttributes>
    implements PickAttributes
{
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @ForeignKey(() => Round)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    roundId!: number;

    @BelongsTo(() => Round)
    round!: Round;

    @ForeignKey(() => Team)
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    teamId!: string;

    @BelongsTo(() => Team)
    team!: Team;
}
