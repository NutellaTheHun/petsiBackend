import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateUnitOfMeasureDto {
  @ApiPropertyOptional({
    description: 'Name of the UnitofMeasure entity.',
    example: 'Kilogram',
  })
  @IsString()
  @IsOptional()
  readonly unitName?: string;

  @ApiPropertyOptional({
    description: "abbrieviation of the UnitofMeasure entity's name.",
    example: 'kg',
  })
  @IsString()
  @IsOptional()
  readonly abbreviation?: string;

  @ApiPropertyOptional({
    description:
      'Id of the UnitofMeasureCategory entity that the UnitofMeasure falls under.',
    example: 1,
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly categoryId?: number | null;

  @ApiPropertyOptional({
    description:
      'The conversion factor stored as a string to prevent rounding errors, to the base amount.',
    example: '3785.4080001023799014',
  })
  @IsString()
  @IsOptional()
  readonly conversionFactorToBase?: string;
}
