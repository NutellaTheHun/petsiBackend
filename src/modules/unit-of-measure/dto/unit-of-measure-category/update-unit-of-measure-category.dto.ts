import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateUnitOfMeasureCategoryDto {
  @ApiProperty({
    description: 'Name of UnitCategory entity.',
    example: 'Volume',
  })
  @IsString()
  @IsOptional()
  readonly categoryName?: string;

  @ApiProperty({
    description:
      'The UnitOfMeasure entity that all UnitofMeasure entities under the category convert to as part of conversions.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly baseUnitId?: number | null;
}
