import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateOrderTypeDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    readonly orderIds: number[];
}