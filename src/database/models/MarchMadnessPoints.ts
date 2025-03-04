import {
    Table,
    Column,
    Model,
    PrimaryKey,
    AutoIncrement,
    AllowNull,
    DataType,
    CreatedAt,
    UpdatedAt
} from 'sequelize-typescript';

@Table({
    tableName: 'march_madness_points',
    timestamps: true
})
export class MarchMadnessPoints extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    userId!: string;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    score!: number;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    maxPossibleScore!: number;

    @CreatedAt
    @Column
    createdAt!: Date;

    @UpdatedAt
    @Column
    updatedAt!: Date;
}