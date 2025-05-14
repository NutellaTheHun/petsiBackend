import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemVendorDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}