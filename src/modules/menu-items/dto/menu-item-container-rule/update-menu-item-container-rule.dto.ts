import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateMenuItemContainerRuleDto {
  @ApiProperty({
    description: 'Id of a MenuItem entity that is a valid component',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  validMenuItemId?: number;

  @ApiProperty({
    description:
      'Id of a MenuItemSize entity that is a valid size to the validMenuItem, and to the container',
    example: [2, 3],
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  validSizeIds?: number[];
}
