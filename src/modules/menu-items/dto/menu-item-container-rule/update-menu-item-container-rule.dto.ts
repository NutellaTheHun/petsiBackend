import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateMenuItemContainerRuleDto {
  @ApiPropertyOptional({
    description: 'Id of a MenuItem entity that is a valid component',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly validMenuItemId?: number;

  @ApiPropertyOptional({
    description:
      'Id of a MenuItemSize entity that is a valid size to the validMenuItem, and to the container',
    example: [2, 3],
    type: 'number',
    isArray: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly validSizeIds?: number[];
}
