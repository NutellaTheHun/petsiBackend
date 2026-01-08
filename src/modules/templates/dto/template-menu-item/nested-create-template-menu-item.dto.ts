import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { NestedCreate } from '../../../../common/base/nested-create.base';
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/menu-items.module';

export class NestedCreateTemplateMenuItemDto extends NestedCreate {
  @ApiProperty({
    description:
      'Name to be used on the baking list representing the referenced MenuItem.',
    example: 'CBP',
  })
  @IsString()
  @IsNotEmpty()
  readonly displayName: string;

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
    description: 'Id of the MenuItem entity being displayed on the Template.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly menuItemId: EntityId<MenuItem>;
}
