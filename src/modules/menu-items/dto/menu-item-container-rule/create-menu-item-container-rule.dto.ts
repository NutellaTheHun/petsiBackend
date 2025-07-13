import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateMenuItemContainerRuleDto {
  @ApiProperty({
    description:
      'Id of the MenuItemContainerOptions entity. Pass this property when creating through the MenuItemContainerRule endpoint (rather than through the MenuItem',
    example: 1,
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly parentContainerOptionsId?: number;

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
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly validSizeIds: number[];
}
