import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildOrderContainerItemDto } from '../order-container-item/create-child-order-container-item.dto';
import { UpdateChildOrderContainerItemDto } from '../order-container-item/update-child-order-container-item.dto';

export class UpdateChildOrderMenuItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Order entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of child OrderMenuItem to be updated' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({
        description: 'Id of MenuItem entity being ordered.',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId?: number

    @ApiProperty({
        description: 'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemSizeId?: number

    @ApiProperty({ description: 'Amount being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly quantity?: number

    @ApiProperty({
        description: 'Dtos when creating an OrderMenuItem entity that is a container for a list of MenuItem',
        type: [UpdateChildOrderContainerItemDto]
    })
    @IsArray()
    @IsOptional()
    readonly orderedItemContainerDtos?: (CreateChildOrderContainerItemDto | UpdateChildOrderContainerItemDto)[];
}