import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMenuItemCategoryDto {
  @ApiPropertyOptional({
    example: 'Pie',
    description: 'Name of the MenuItemCategory.',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly categoryName?: string;
}
