import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemPackageDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}

export function CreateDefaultInventoryItemPackageDtoValues(): Partial<CreateInventoryItemPackageDto> {
    return {
        
    };
}