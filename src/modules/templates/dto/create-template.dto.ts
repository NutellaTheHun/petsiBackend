import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateTemplateMenuItemDto } from "./create-template-menu-item.dto";

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsBoolean()
    @IsOptional()
    readonly isPie: boolean;

    /*@IsArray()
    @IsNumber({}, { each: true})
    @IsPositive({ each: true})
    readonly templateItemIds: number[] = [];*/
    @IsOptional()
    @IsArray()
    itemDtos?: CreateTemplateMenuItemDto[];
}
