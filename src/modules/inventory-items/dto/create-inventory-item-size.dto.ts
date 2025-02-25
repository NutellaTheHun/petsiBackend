import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateInventoryItemSizeDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly unitOfMeasureId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryPackageTypeId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;
}

export function CreateDefaultInventoryItemSizeDtoValues(): Partial<CreateInventoryItemSizeDto> {
    return {
        
    };
}