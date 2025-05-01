import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { CreateMenuItemComponentDto } from './create-menu-item-component.dto';
import { UpdateMenuItemComponentDto } from './update-menu-item-component.dto';
import { MenuItemComponentUnionResolver } from '../utils/menu-item-component-union-resolver';
import { Type } from 'class-transformer';

export class UpdateMenuItemDto {
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
    @IsOptional()
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
    @IsOptional()
    readonly validSizeIds: number[];

    @IsBoolean()
    @IsOptional()
    readonly isPOTM: boolean;

    @IsBoolean()
    @IsOptional()
    readonly isParbake: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MenuItemComponentUnionResolver)
    readonly containerComponentDtos: (CreateMenuItemComponentDto | UpdateMenuItemComponentDto)[];
}
