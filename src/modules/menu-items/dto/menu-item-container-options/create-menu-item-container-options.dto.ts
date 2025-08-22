import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { NestedMenuItemContainerRuleDto } from '../menu-item-container-rule/nested-menu-item-container-rule.dto';

export class CreateMenuItemContainerOptionsDto {
  @ApiPropertyOptional({
    description:
      'Id of the MenuItem entity that the options apply to. Is required if sending DTO to menu-item-container-options endpoint. Is not required if sending DTO as a nested dto of a create menu-item request.',
    example: 1,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentContainerMenuItemId?: number;

  @ApiProperty({
    description:
      'The list of MenuItems and their sizes that are allowed in the container',
    type: [NestedMenuItemContainerRuleDto],
    example: [
      {
        mode: 'create',
        createDto: {
          validMenuItemId: 2,
          validSizeIds: [3, 4],
        },
      },
      {
        mode: 'create',
        createDto: {
          validMenuItemId: 5,
          validSizeIds: [6, 7],
        },
      },
    ],
  })
  @IsArray()
  readonly containerRuleDtos: NestedMenuItemContainerRuleDto[];

  @ApiProperty({
    description:
      'The total size of the container. When ordered, the summation of ordermenuitemcomponents have to equal this value.',
    example: 8,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly validQuantity: number;
}
