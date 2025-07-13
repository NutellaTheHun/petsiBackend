/*import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateChildMenuItemContainerRuleDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a MenuItemContainerOptions entity.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description: 'Id of a MenuItem entity that is a valid component',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly validMenuItemId: number;

  @ApiProperty({
    description:
      'Id of a MenuItemSize entity that is a valid size to the validMenuItem, and to the container',
    example: [2, 3],
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly validSizeIds: number[];
}*/
