import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';

export class UpdateUnitOfMeasureCategoryDto {
    @ApiProperty({
        description: 'Name of UnitCategory entity.',
        example: 'Volume',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description:
            'The UnitOfMeasure entity that all UnitofMeasure entities under the category convert to as part of conversions.',
        example: 1,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly baseConversionUnitId: EntityId<UnitOfMeasure> | null;
}
