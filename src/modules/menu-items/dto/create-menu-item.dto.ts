import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateMenuItemComponentDto } from "./create-menu-item-component.dto";

export class CreateMenuItemDto {
    @IsString()
    @IsOptional()
    readonly squareCatalogId?: string;

    @IsString()
    @IsOptional()
    readonly squareCategoryId?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly categoryId?: number;

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly searchNames?: string[];

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
    @IsNotEmpty()
    readonly validSizeIds: number[];

    @IsBoolean()
    @IsOptional()
    readonly isPOTM: boolean;

    @IsBoolean()
    @IsOptional()
    readonly isParbake: boolean;

    @IsOptional()
    @IsArray()
    readonly containerComponentDtos: CreateMenuItemComponentDto[];
}
