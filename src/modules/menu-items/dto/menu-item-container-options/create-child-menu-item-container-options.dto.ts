import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { CreateChildMenuItemContainerRuleDto } from '../menu-item-container-rule/create-child-menu-item-container-rule.dto';

export class CreateChildMenuItemContainerOptionsDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a MenuItem entity.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description:
      'The list of MenuItems and their sizes that are allowed in the container',
    type: [CreateChildMenuItemContainerRuleDto],
    example: [
      {
        mode: 'create',
        validMenuItemId: 1,
        validSizeIds: [2, 3],
      },
      {
        mode: 'create',
        validMenuItemId: 4,
        validSizeIds: [5, 6],
      },
    ],
  })
  @IsArray()
  containerRuleDtos: CreateChildMenuItemContainerRuleDto[];

  @ApiProperty({
    description:
      'The total size of the container. When ordered, the summation of ordermenuitemcomponents have to equal this value.',
    example: 7,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  validQuantity: number;
}
