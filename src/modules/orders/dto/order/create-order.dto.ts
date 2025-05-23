import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateChildOrderMenuItemDto } from "../order-menu-item/create-child-order-menu-item.dto";

export class CreateOrderDto {
    @ApiProperty({ example: 'Order categories such as: Wholesale, Square, Special', description: 'Id of Order-Type entity.' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly orderCategoryId: number

    @ApiProperty({ example: 'John Smith, Pepperidge Farms', description: 'Name of the owner of the order' })
    @IsString()
    @IsNotEmpty()
    readonly recipient: string;

    @ApiProperty({ example: 'Jane Doe, Mike', description: 'Name of who is picking up the order or reciving the delivery' })
    @IsString()
    @IsOptional()
    readonly fulfillmentContactName?: string;

    @ApiProperty({ description: 'Date the order is to be available or delivered.' })
    @IsDate()
    @IsNotEmpty()
    readonly fulfillmentDate: Date;

    @ApiProperty({ example: 'pickup or delivery', description: 'Method of Order\'s dispersal.' })
    @IsString()
    @IsNotEmpty()
    readonly fulfillmentType: string;

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

    @ApiProperty({ description: 'If is weekly, is the day of the week the order is fulfilled' })
    @IsString()
    @IsOptional()
    readonly weeklyFulfillment?: string;

    @ApiProperty({
        description: 'An array of CreateChildOrderMenuItemDtos. Child dtos are used when creating an Order entity with child entites.',
        type: [CreateChildOrderMenuItemDto]
    })
    @IsArray()
    orderedMenuItemDtos: CreateChildOrderMenuItemDto[];
}
