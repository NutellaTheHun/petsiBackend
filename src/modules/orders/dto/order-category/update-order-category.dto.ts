import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of the OrderCategory entity.',
    example: 'Wholesale',
  })
  @IsString()
  @IsOptional()
  readonly categoryName?: string;
}
