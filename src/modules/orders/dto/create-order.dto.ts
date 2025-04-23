import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateOrderMenuItemDto } from "./create-order-menu-item.dto";

export class CreateOrderDto {
    @IsString()
    @IsOptional()
    readonly squareOrderId?: string;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly orderTypeId: number

    @IsString()
    @IsNotEmpty()
    readonly recipient: string;

    @IsDate()
    @IsNotEmpty()
    readonly fulfillmentDate: Date;

    @IsString()
    @IsNotEmpty()
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
    orderMenuItemDtos?: CreateOrderMenuItemDto[];
}
