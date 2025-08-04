import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedMenuItemContainerRuleDto } from '../menu-item-container-rule/nested-menu-item-container-rule.dto';

export class UpdateMenuItemContainerOptionsDto {
  @ApiPropertyOptional({
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
        mode: 'update',
        id: 1,
        updateDto: {
          id: 5,
          dto: {
            validMenuItemId: 6,
            validSizeIds: [7, 8],
          },
        },
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly containerRuleDtos?: NestedMenuItemContainerRuleDto[];

  @ApiPropertyOptional({
    description:
      'The total size of the container. When ordered, the summation of OrderMenuItemComponents have to equal this value.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly validQuantity?: number;
}
