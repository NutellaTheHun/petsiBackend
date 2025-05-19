import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildOrderContainerItemDto } from '../order-container-item/create-child-order-container-item.dto';
import { UpdateChildOrderContainerItemDto } from '../order-container-item/update-child-order-container-item.dto';

export class UpdateOrderMenuItemDto {
    @ApiProperty({ description: 'Id of Menu-Item entity being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId?: number

    @ApiProperty({ description: 'Id of the Menu-Item-Size entity. Must be valid size for the Menu-Item being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemSizeId?: number

    @ApiProperty({ description: 'Amount being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly quantity?: number

    @ApiProperty({ description: 'Dtos when creating an Order-Menu-Item entity that is a container for a list of Menu-Item',
        type: [UpdateChildOrderContainerItemDto]
    })
    @IsArray()
    @IsOptional()
    readonly OrderedItemComponentDtos?: (CreateChildOrderContainerItemDto | UpdateChildOrderContainerItemDto)[];
}
