import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemSizeDto {
    @IsString()
    @IsNotEmpty()
    readonly measureUnit: string;

    @IsString()
    @IsNotEmpty()
    readonly packageType: string;
}