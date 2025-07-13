import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateMenuItemContainerRuleDto } from './update-menu-item-container-rule.dto';

export class NestedUpdateMenuItemContainerRuleDto {
  @ApiPropertyOptional({
    description: 'Id of a MenuItemContainerRule entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiPropertyOptional({
    description: 'Update dto of a MenuItemContainerRule entity.',
    type: UpdateMenuItemContainerRuleDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateMenuItemContainerRuleDto)
  readonly dto?: UpdateMenuItemContainerRuleDto;
}
