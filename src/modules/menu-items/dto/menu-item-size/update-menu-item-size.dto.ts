import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMenuItemSizeDto {
  @ApiProperty({
    description: 'Name of MenuItemSize entity.',
    example: 'medium',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly sizeName?: string;
}
