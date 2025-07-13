import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateOrderMenuItemDto } from './update-order-menu-item.dto';

export class NestedUpdateOrderMenuItemDto {
  @ApiProperty({
    description: 'Id of a OrderMenuItem entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  readonly id: number;

  @ApiProperty({
    description: 'Update dto of a OrderMenuItem entity.',
    type: UpdateOrderMenuItemDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderMenuItemDto)
  readonly dto: UpdateOrderMenuItemDto;
}
