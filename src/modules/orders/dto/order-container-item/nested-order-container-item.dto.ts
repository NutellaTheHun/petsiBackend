import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateOrderContainerItemDto } from './create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from './nested-update-order-container-item.dto';

export class NestedOrderContainerItemDto {
  @ApiProperty({
    description: 'Create dto of a OrderContainerItem entity.',
    type: CreateOrderContainerItemDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderContainerItemDto)
  readonly create?: CreateOrderContainerItemDto;

  @ApiProperty({
    description: 'Update dto of a OrderContainerItem entity.',
    type: NestedUpdateOrderContainerItemDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedUpdateOrderContainerItemDto)
  readonly update?: NestedUpdateOrderContainerItemDto;
}
