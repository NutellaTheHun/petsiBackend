import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMenuItemCategoryDto {
  @ApiProperty({
    example: 'Pastry',
    description: 'Name of the MenuItemCategory.',
  })
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;
}
