import {
    Table,
    Column,
    Model,
    PrimaryKey,
    DataType,
    HasMany,
} from 'sequelize-typescript';
import { Round } from './Round';
import { Optional } from 'sequelize/types';

interface BracketAttributes {
    userId: string;
}

interface BracketCreationAttributes
    extends Optional<BracketAttributes, 'userId'> {}

@Table({ tableName: 'brackets' })
export class Bracket
    extends Model<BracketAttributes, BracketCreationAttributes>
    implements BracketAttributes
{
    @PrimaryKey
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    userId!: string;

    @HasMany(() => Round)
    rounds!: Round[];
}
