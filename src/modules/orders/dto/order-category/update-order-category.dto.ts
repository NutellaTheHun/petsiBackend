import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderCategoryDto {
  @ApiProperty({
    description: 'Name of the OrderCategory entity.',
    example: 'Wholesale',
  })
  @IsString()
  @IsOptional()
  readonly categoryName?: string;
}
