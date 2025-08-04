import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateMenuItemContainerRuleDto } from './create-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from './update-menu-item-container-rule.dto';

export class NestedMenuItemContainerRuleDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for MenuItemContainerRule entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'Create dto of a MenuItemContainerRule entity.',
    type: CreateMenuItemContainerRuleDto,
    example: {
      validMenuItemId: 1,
      validSizeIds: [1, 2],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMenuItemContainerRuleDto)
  readonly createDto?: CreateMenuItemContainerRuleDto;

  @ApiPropertyOptional({
    description: 'Update dto of a MenuItemContainerRule entity.',
    type: UpdateMenuItemContainerRuleDto,
    example: {
      id: 1,
      dto: {
        validMenuItemId: 2,
        validSizeIds: [3, 4],
      },
    },
  })
  @IsOptional()
  @ValidateNested()
  //@Type(() => UpdateMenuItemContainerRuleDto)
  readonly updateDto?: UpdateMenuItemContainerRuleDto;
}
