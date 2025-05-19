import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateOrderContainerItemDto {
    @ApiProperty({ description: 'Id of the Menu-Item that is being ordered' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    containedMenuItemId?: number;

    @ApiProperty({ description: 'Id of the Menu-Item-Size that is being ordered, must be a valid size to the containedMenuItem' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    containedItemSizeId?: number;

    @ApiProperty({ description: 'amount of the containedMenuItem / containedItemSize being ordered' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    quantity?: number;
}