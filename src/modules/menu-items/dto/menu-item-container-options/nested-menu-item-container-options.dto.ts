import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateMenuItemContainerOptionsDto } from './create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from './update-menu-item-container-options.dto';

export class NestedMenuItemContainerOptionsDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
    enum: ['create', 'update'],
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for MenuItemContainerOptions entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'CreateMenuItemContainerOptionsDto',
    example: {
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
  readonly createDto?: CreateMenuItemContainerOptionsDto;

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
  readonly updateDto?: UpdateMenuItemContainerOptionsDto;
}
