import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateChildTemplateMenuItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a Template entity.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description:
      'Name to be used on the baking list representing the referenced MenuItem.',
    example: 'BLUE',
  })
  @IsString()
  @IsNotEmpty()
  readonly displayName: string;

  @ApiProperty({
    description: 'Id of the MenuItem entity being displayed on the Template.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly menuItemId: number;

  @ApiProperty({
    description:
      'The row position of the TemplateMenuItem on the parent Template.',
    example: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly tablePosIndex: number;
}
