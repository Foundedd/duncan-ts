import { Table,
         Column,
         Model,
         PrimaryKey,
         AutoIncrement,
         AllowNull,
         DataType,
         CreatedAt,
         UpdatedAt} from 'sequelize-typescript';

@Table({
    tableName: 'march_madness_picks',
    timestamps: true
})
export class MarchMadnessPicks extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    userId!: string;

    @AllowNull(false)
    @Column
    matchId!: string;

    @AllowNull(false)
    @Column
    teamPicked!: string;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    pointsSubmitted?: number;

    @CreatedAt
    @Column
    createdAt!: Date;

    @UpdatedAt
    @Column
    updatedAt!: Date;
}

