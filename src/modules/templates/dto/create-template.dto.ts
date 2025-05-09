import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateTemplateMenuItemDto } from "./create-template-menu-item.dto";

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsBoolean()
    @IsOptional()
    readonly isPie: boolean;

    @IsOptional()
    @IsArray()
    itemDtos?: CreateTemplateMenuItemDto[];
}
