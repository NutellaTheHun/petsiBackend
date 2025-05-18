import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildOrderMenuItemComponentDto } from "./create-child-order-menu-item-component.dto";
import { UpdateChildOrderMenuItemComponentDto } from "./update-child-order-menu-item-component.dto";

export class UpdateOrderMenuItemComponentDto {
    @ApiProperty({ description: 'Id of the Menu-Item that is being ordered' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    componentMenuItemId?: number;

    @ApiProperty({ description: 'Id of the Menu-Item-Size that is being ordered, must be a valid size to the componentMenuItem' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    componentItemSizeId?: number;

    @ApiProperty({ description: 'amount of the componentMenuItem / componentItemSize being ordered' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    quantity?: number;
}