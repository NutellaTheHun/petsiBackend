import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateOrderCategoryDto {
    @ApiProperty({ example: 'Wholesale, Special, Square', description: 'Name of the Order-Type entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}