import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { CreateMenuItemContainerOptionsDto } from './create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from './update-menu-item-container-options.dto';

export class NestedMenuItemContainerOptionsDto {
  @ApiPropertyOptional({
    description: 'CreateMenuItemContainerOptionsDto',
    example: {
      parentContainerMenuItemId: 1,
      containerRuleDtos: [
        {
          validMenuItemId: 2,
          validSizeIds: [3, 4],
        },
      ],
      validQuantity: 5,
    },
  })
  @ValidateNested()
  readonly create?: CreateMenuItemContainerOptionsDto;

  @ApiPropertyOptional({
    description: 'UpdateMenuItemContainerOptionsDto',
    example: {
      id: 1,
      dto: {
        containerRuleDtos: [1, 2],
        validQuantity: 3,
      },
    },
  })
  @ValidateNested()
  readonly update?: UpdateMenuItemContainerOptionsDto;
}
