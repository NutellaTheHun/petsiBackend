import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildComponentOptionDto } from "../child-component-option/create-child-component-option.dto";

export class CreateMenuItemComponentOptionsDto {
    @ApiProperty({ description: 'Id of the Menu-Item entity that the options apply to.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    containerMenuItemId: number;

    @ApiProperty({ 
        example: 'Box of 6 scones is dynamic (can be any combination of the 3 flavors totaling 6). A Breakfast Pastry Platter is not dynamic (Preset assortment of items per size)',
        description: 'Is dynamic if the quanties vary accross the valid MenuItems/MenuItemSizes' })
    @IsBoolean()
    @IsOptional()
    isDynamic?: boolean;

    @ApiProperty({ description: 'The list of MenuItems and their sizes that are allowed in the container', type: [CreateChildComponentOptionDto] })
    @IsArray()
    componentOptionDtos: CreateChildComponentOptionDto[];

    @ApiProperty({ description: 'The total size of the container. When ordered, the summation of order-menu-item-components have to equal this value.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    validQuantity: number;
}