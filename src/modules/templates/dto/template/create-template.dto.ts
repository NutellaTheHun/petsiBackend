import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateChildTemplateMenuItemDto } from "../template-menu-item/create-child-template-menu-item.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTemplateDto {
    @ApiProperty({ example: 'Summer Pies, Spring Pastries', description: 'Name of the Template entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: 'If the template displays a list of pies. Templates display either Pies or Pastries.' })
    @IsBoolean()
    @IsOptional()
    readonly isPie?: boolean;

    @ApiProperty({ description: 'Array of CreateChildTemplateMenuItemDtos, child dtos are used when creating a Template entity with child TemplateMenuItem entites.',
        type: [CreateChildTemplateMenuItemDto]
     })
    @IsOptional()
    @IsArray()
    itemDtos?: CreateChildTemplateMenuItemDto[];
}
