import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMenuItemCategoryDto {
  @ApiProperty({ example: 'Pie', description: 'Name of the MenuItemCategory.' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly categoryName?: string;
}
