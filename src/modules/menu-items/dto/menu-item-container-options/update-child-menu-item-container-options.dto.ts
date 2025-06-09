import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { CreateChildMenuItemContainerRuleDto } from '../menu-item-container-rule/create-child-menu-item-container-rule.dto';
import { UpdateChildMenuItemContainerRuleDto } from '../menu-item-container-rule/update-child-menu-item-container-rule.dto';

export class UpdateChildMenuItemContainerOptionsDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a MenuItem entity with components.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of the MenuItemContainerOptions to update.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description:
      'The list of MenuItems and their sizes that are allowed in the container',
    type: [CreateChildMenuItemContainerRuleDto],
    example: [
      {
        mode: 'create',
        validMenuItemId: 2,
        validSizeIds: [3, 4],
      },
      {
        mode: 'update',
        id: 5,
        validMenuItemId: 6,
        validSizeIds: [7, 8],
      },
    ],
  })
  @IsArray()
  @IsOptional()
  containerRuleDtos?: (
    | CreateChildMenuItemContainerRuleDto
    | UpdateChildMenuItemContainerRuleDto
  )[];

  @ApiProperty({
    description:
      'The total size of the container. When ordered, the summation of OrderMenuItemComponents have to equal this value.',
    example: 9,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  validQuantity?: number;
}
