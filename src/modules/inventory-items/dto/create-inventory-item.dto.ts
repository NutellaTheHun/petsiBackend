import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventoryItemDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    readonly category: string;

    @IsArray()
    @IsNumber({},{ each: true })
    @IsPositive({ each: true})
    readonly sizeIds: number[] = [];
}