import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildOrderMenuItemComponentDto } from './create-child-order-menu-item-component.dto';
import { UpdateChildOrderMenuItemComponentDto } from './update-child-order-menu-item-component.dto';

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
        type: [UpdateChildOrderMenuItemComponentDto]
    })
    @IsArray()
    @IsOptional()
    readonly OrderedItemComponentDtos?: (CreateChildOrderMenuItemComponentDto | UpdateChildOrderMenuItemComponentDto)[];
}
