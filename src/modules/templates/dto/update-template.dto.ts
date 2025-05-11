import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TemplateMenuItemUnionResolver } from '../utils/template-menu-item-union-resolver';
import { CreateChildTemplateMenuItemDto } from './create-child-template-menu-item.dto';
import { UpdateChildTemplateMenuItemDto } from './update-child-template-menu-item.dto';

export class UpdateTemplateDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsBoolean()
    @IsOptional()
    readonly isPie: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TemplateMenuItemUnionResolver)
    itemDtos?: (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[];
}
