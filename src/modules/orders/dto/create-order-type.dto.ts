import { IsNotEmpty, IsString } from "class-validator";

export class CreateOrderTypeDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}