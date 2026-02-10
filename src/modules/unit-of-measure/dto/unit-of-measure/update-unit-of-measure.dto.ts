import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { UnitOfMeasureCategory } from '../../entities/unit-of-measure-category.entity';

export class UpdateUnitOfMeasureDto {
    @ApiProperty({
        description: 'Name of the UnitofMeasure entity.',
        example: 'Kilogram',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: "abbrieviation of the UnitofMeasure entity's name.",
        example: 'kg',
    })
    @IsString()
    @IsNotEmpty()
    readonly abbreviation: string;

    @ApiProperty({
        description:
            'The conversion factor stored as a string to prevent rounding errors, to the base amount.',
        example: '3785.4080001023799014',
    })
    @IsString()
    @IsNotEmpty()
    readonly conversionFactorToBase: string;

    @ApiProperty({
        description:
            'Id of the UnitofMeasureCategory entity that the UnitofMeasure falls under.',
        example: 1,
        type: 'number',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly categoryId: EntityId<UnitOfMeasureCategory> | null;
}
