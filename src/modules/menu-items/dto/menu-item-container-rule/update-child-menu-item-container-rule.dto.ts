import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateChildMenuItemContainerRuleDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a MenuItemContainerOption entity.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of the MenuItemContainerRule to update.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'Id of a MenuItem entity that is a valid component',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  validMenuItemId?: number;

  @ApiProperty({
    description:
      'Id of a MenuItemSize entity that is a valid size to the validMenuItem, and to the container',
    example: [3, 4],
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  validSizeIds?: number[];
}
