import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateMenuItemDto {

    @IsString()
    @IsOptional()
    readonly squareCatalogId?: string;

    @IsString()
    @IsOptional()
    readonly squareCategoryId?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly categoryId: number;

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsString({ each: true })
    readonly searchNames?: string[] = [];

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly veganOptionMenuId?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly takeNBakeOptionMenuId?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly veganTakeNBakeOptionMenuId?: number;

    @IsArray()
    @IsNumber({},{ each: true})
    @IsPositive({ each: true})
    readonly validSizeIds: number[] = [];

    @IsBoolean()
    @IsOptional()
    readonly isPOTM: boolean;

    @IsBoolean()
    @IsOptional()
    readonly isParbake: boolean;

    @IsArray()
    @IsNumber()
    @IsPositive({ each: true})
    readonly orderMenuItemIds: number[] = [];
}
