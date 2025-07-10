import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateUnitOfMeasureCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of UnitCategory entity.',
    example: 'Volume',
  })
  @IsString()
  @IsOptional()
  readonly categoryName?: string;

  @ApiPropertyOptional({
    description:
      'The UnitOfMeasure entity that all UnitofMeasure entities under the category convert to as part of conversions.',
    example: 1,
    nullable: true,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly baseUnitId?: number | null;
}
