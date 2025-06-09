import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { Template } from '../../entities/template.entity';

/**
 * Depreciated, only created as a child through {@link Template}.
 */
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
    description: 'Id of the parent Template entity.',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly templateId: number;
}
