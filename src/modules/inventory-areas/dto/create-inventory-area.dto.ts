import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryAreaDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}