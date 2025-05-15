import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { OrderMenuItemUnionResolver } from '../utils/order-menu-item-union-resolver';
import { CreateChildOrderMenuItemDto } from './create-child-order-menu-item.dto';
import { UpdateChildOrderMenuItemDto } from './update-child-order-menu-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto{
    @ApiProperty({ description: 'Id of the order from Square\'s orders api representing the referencing Order entity.' })
    @IsString()
    @IsOptional()
    readonly squareOrderId?: string;

    @ApiProperty({ example: 'Order types such as: Wholesale, Square, Special', description: 'Id of Order-Type entity.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly orderTypeId?: number

    @ApiProperty({ example: 'John Smith, Pepperidge Farms', description: 'Name of the owner of the order' })
    @IsString()
    @IsOptional()
    readonly recipient?: string;

    @ApiProperty({ description: 'Date the order is to be available or delivered.' })
    @IsDate()
    @IsOptional()
    readonly fulfillmentDate?: Date;

    @ApiProperty({example: 'pickup or delivery', description: 'Method of Order\'s dispersal.' })
    @IsString()
    @IsOptional()
    readonly fulfillmentType?: string;

    @ApiProperty({ description: 'for delivery contact information' })
    @IsString()
    @IsOptional()
    readonly deliveryAddress?: string;

    @ApiProperty({ description: 'for delivery contact information' })
    @IsString()
    @IsOptional()
    readonly phoneNumber?: string;

    @ApiProperty({ description: 'for delivery contact information' })
    @IsString()
    @IsOptional()
    readonly email?: string;

    @ApiProperty({ description: 'special instruction for order' })
    @IsString()
    @IsOptional()
    readonly note?: string;

    @ApiProperty({ description: 'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.' })
    @IsBoolean()
    @IsOptional()
    readonly isFrozen?: boolean;

    @ApiProperty({ description: 'Is true if the order occurs on a weekly basis.' })
    @IsBoolean()
    @IsOptional()
    readonly isWeekly?: boolean;

    @ApiProperty({ description: 'An array of CreateChildOrderMenuItemDtos. Child dtos are used when creating an Order entity with child entites.',
        type: [UpdateChildOrderMenuItemDto]
     })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderMenuItemUnionResolver)
    orderMenuItemDtos?: (CreateChildOrderMenuItemDto | UpdateChildOrderMenuItemDto)[];
}
