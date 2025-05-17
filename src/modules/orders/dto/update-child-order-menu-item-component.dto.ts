import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildOrderMenuItemComponentDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Order-Menu-Item entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the Order-Menu-Item-Component to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

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