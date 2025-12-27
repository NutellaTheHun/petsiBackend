import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateMenuItemContainerRuleDto {
  @ApiProperty({
    description: 'Id of the item the rule pertains to.',
    example: '1',
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentMenuItemId: number;

  @ApiProperty({
    description: 'Id of a MenuItem entity that is a valid component',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly validMenuItemId: number;

  @ApiProperty({
    description:
      'Id of a MenuItemSize entity that is a valid size to the validMenuItem, and to the container',
    example: [3, 4],
    type: 'number',
    isArray: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly validSizeIds: number[];

  @ApiProperty({
    description: 'Optional setting if specific item has a max amount.',
    example: 6,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly maxQuantity?: number;
}
