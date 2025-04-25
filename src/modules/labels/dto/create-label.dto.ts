import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsSemVer, IsString } from "class-validator";

export class CreateLabelDto {
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly menuItemId: number;

    @IsString()
    @IsNotEmpty()
    readonly imageUrl: string;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly typeId: number;
}
