import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TemplateMenuItemUnionResolver } from '../../utils/template-menu-item-union-resolver';
import { CreateChildTemplateMenuItemDto } from '../template-menu-item/create-child-template-menu-item.dto';
import { UpdateChildTemplateMenuItemDto } from '../template-menu-item/update-child-template-menu-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTemplateDto{
    @ApiProperty({ example: 'Summer Pies, Spring Pastries', description: 'Name of the Template entity.' })
    @IsString()
    @IsOptional()
    readonly templateName?: string;

    @ApiProperty({ description: 'If the template displays a list of pies. Templates display either Pies or Pastries.' })
    @IsBoolean()
    @IsOptional()
    readonly isPie?: boolean;

    @ApiProperty({ description: 'Mixed array of CreateChildTemplateMenuItemDtos and UpdateChildTemplateMenuItemDto, child dtos are used when updating a Template entity with created/updated child TemplateMenuItem entites.',
        type: [UpdateChildTemplateMenuItemDto]
     })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TemplateMenuItemUnionResolver)
    templateItemDtos?: (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[];
}
