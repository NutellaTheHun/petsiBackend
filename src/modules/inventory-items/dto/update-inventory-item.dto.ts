import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryItemDto {
    @IsString()
    @IsOptional()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId: number;

    @IsArray()
    @IsNumber({},{ each: true })
    @IsPositive({ each: true})
    @IsOptional()
    readonly sizeIds: number[] = [];

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId: number;
}