import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateMenuItemContainerRuleDto } from './create-menu-item-container-rule.dto';
import { NestedUpdateMenuItemContainerRuleDto } from './nested-update-menu-item-container-rule.dto';

export class NestedMenuItemContainerRuleDto {
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
  readonly create?: CreateMenuItemContainerRuleDto;

  @ApiPropertyOptional({
    description: 'Update dto of a MenuItemContainerRule entity.',
    type: NestedUpdateMenuItemContainerRuleDto,
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
  @Type(() => NestedUpdateMenuItemContainerRuleDto)
  readonly update?: NestedUpdateMenuItemContainerRuleDto;
}
