import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export abstract class NestedDtoBase<CDto, UDto> {
  @ApiProperty({
    description: 'temporary id for create dtos for mapping on the frontend',
    example: 'th3w-4257ds',
  })
  @IsNotEmpty()
  readonly createId?: string;

  @ApiPropertyOptional({
    description: 'Id of entity being updated',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  readonly id?: number;

  readonly createDto?: CDto;

  readonly updateDto?: UDto;
}
