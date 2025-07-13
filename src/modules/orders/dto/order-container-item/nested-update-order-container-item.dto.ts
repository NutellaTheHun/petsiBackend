import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateOrderContainerItemDto } from './update-order-container-item.dto';

export class NestedUpdateOrderContainerItemDto {
  @ApiProperty({
    description: 'Id of a OrderContainerItem entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'Update dto of a OrderContainerItem entity.',
    type: UpdateOrderContainerItemDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderContainerItemDto)
  readonly dto: UpdateOrderContainerItemDto;
}
