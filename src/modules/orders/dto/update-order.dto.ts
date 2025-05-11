import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { OrderMenuItemUnionResolver } from '../utils/order-menu-item-union-resolver';
import { CreateChildOrderMenuItemDto } from './create-child-order-menu-item.dto';
import { UpdateChildOrderMenuItemDto } from './update-child-order-menu-item.dto';

export class UpdateOrderDto{
    @IsString()
    @IsOptional()
    readonly squareOrderId?: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly orderTypeId: number

    @IsString()
    @IsOptional()
    readonly recipient: string;

    @IsDate()
   @IsOptional()
    readonly fulfillmentDate: Date;

    @IsString()
    @IsOptional()
    readonly fulfillmentType: string;

    @IsString()
    @IsOptional()
    readonly deliveryAddress?: string;

    @IsString()
    @IsOptional()
    readonly phoneNumber?: string;

    @IsString()
    @IsOptional()
    readonly email?: string;

    @IsString()
    @IsOptional()
    readonly note?: string;

    @IsBoolean()
    @IsOptional()
    readonly isFrozen: boolean;

    @IsBoolean()
    @IsOptional()
    readonly isWeekly: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderMenuItemUnionResolver)
    orderMenuItemDtos?: (CreateChildOrderMenuItemDto | UpdateChildOrderMenuItemDto)[];
}
