import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';

export class UpdateUnitOfMeasureCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of UnitCategory entity.',
    example: 'Volume',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description:
      'The UnitOfMeasure entity that all UnitofMeasure entities under the category convert to as part of conversions.',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly baseConversionUnitId?: EntityId<UnitOfMeasure>;
}
