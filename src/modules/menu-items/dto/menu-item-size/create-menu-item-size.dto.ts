import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMenuItemSizeDto {
  @ApiProperty({
    description: 'Name of MenuItemSize entity.',
    example: 'medium',
  })
  @IsString()
  @IsNotEmpty()
  readonly sizeName: string;
}
