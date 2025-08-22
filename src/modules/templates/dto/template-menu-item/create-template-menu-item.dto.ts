import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTemplateMenuItemDto {
  @ApiProperty({
    description:
      'Name to be used on the baking list representing the referenced MenuItem.',
    example: 'CBP',
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

  @ApiProperty({
    description:
      'Id of the parent Template entity. Is required if sending DTO to template-menu-item endpoint. Is not required if sending DTO as a nested dto of a create template request.',
    example: 2,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly templateId?: number;
}
