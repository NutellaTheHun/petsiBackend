import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateMenuItemContainerOptionsDto } from './update-menu-item-container-options.dto';

export class NestedUpdateMenuItemContainerOptionsDto {
  @ApiProperty({
    description: 'Id of a MenuItemContainerOptions entity.',
    example: 1,
  })
  @IsNumber()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly id: number;

  @ApiProperty({
    description: 'UpdateMenuItemContainerOptionsDto',
    example: {
      containerRuleDtos: [1, 2],
      validQuantity: 3,
    },
  })
  @ValidateNested()
  readonly dto: UpdateMenuItemContainerOptionsDto;
}
