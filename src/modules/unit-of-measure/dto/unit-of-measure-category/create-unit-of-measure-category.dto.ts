import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateUnitOfMeasureCategoryDto {
  @ApiProperty({
    description: 'Name of UnitCategory entity.',
    example: 'Weight',
  })
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;

  @ApiProperty({
    description:
      'The UnitOfMeasure entity that all UnitofMeasure entities under the category convert to as part of conversions.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly baseUnitId?: number;
}
