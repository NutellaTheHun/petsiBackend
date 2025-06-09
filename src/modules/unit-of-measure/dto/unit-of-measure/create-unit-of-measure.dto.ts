import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateUnitOfMeasureDto {
  @ApiProperty({
    description: 'Name of the UnitofMeasure entity.',
    example: 'Pound',
  })
  @IsString()
  @IsNotEmpty()
  readonly unitName: string;

  @ApiProperty({
    description: "abbrieviation of the UnitofMeasure entity's name.",
    example: 'lb',
  })
  @IsString()
  @IsNotEmpty()
  readonly abbreviation: string;

  @ApiProperty({
    description:
      'Id of the UnitofMeasureCategory entity that the UnitofMeasure falls under.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly categoryId?: number;

  @ApiProperty({
    description:
      'The conversion factor stored as a string to prevent rounding errors, to the base amount.',
    example: '3785.4080001023799014',
  })
  @IsString()
  @IsOptional()
  readonly conversionFactorToBase?: string;
}
