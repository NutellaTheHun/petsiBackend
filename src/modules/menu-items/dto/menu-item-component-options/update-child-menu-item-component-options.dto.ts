import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive, IsNotEmpty, IsArray, IsBoolean, IsOptional } from "class-validator";
import { CreateChildComponentOptionDto } from "../child-component-option/create-child-component-option.dto";
import { UpdateChildComponentOptionDto } from "../child-component-option/update-child-component-option.dto";

export class UpdateChildMenuItemComponentOptionsDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Menu-Item entity with components.' })
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the Menu-Item-Component-Options to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ 
        example: 'Box of 6 scones is dynamic (can be any combination of the 3 flavors totaling 6). A Breakfast Pastry Platter is not dynamic (Preset assortment of items per size)',
        description: 'Is dynamic if the quanties vary accross the valid MenuItems/MenuItemSizes' })
    @IsBoolean()
    @IsOptional()
    isDynamic?: boolean;

    @ApiProperty({ description: 'The list of MenuItems and their sizes that are allowed in the container', type: [CreateChildComponentOptionDto] })
    @IsArray()
    @IsOptional()
    componentOptionDtos?: (CreateChildComponentOptionDto | UpdateChildComponentOptionDto)[];

    @ApiProperty({ description: 'The total size of the container. When ordered, the summation of order-menu-item-components have to equal this value.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    validQuantity?: number;
}