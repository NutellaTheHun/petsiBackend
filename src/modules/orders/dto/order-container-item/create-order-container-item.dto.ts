import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateOrderContainerItemDto {
    @ApiProperty({ description: 'Id of the Order-Menu-Item that is this container (the parent)' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    parentOrderMenuItemId: number;

    @ApiProperty({ description: 'Id of the Menu-Item that is being ordered' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    componentMenuItemId: number;

    @ApiProperty({ description: 'Id of the Menu-Item-Size that is being ordered, must be a valid size to the componentMenuItem' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    componentItemSizeId: number;

    @ApiProperty({ description: 'amount of the componentMenuItem / componentItemSize being ordered' })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    quantity: number;
}