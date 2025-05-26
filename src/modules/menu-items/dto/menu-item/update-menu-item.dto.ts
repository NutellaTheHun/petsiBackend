import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { MenuItemComponentUnionResolver } from '../../utils/menu-item-component-union-resolver';
import { CreateChildMenuItemContainerItemDto } from '../menu-item-container-item/create-child-menu-item-container-item.dto';
import { UpdateChildMenuItemContainerItemDto } from '../menu-item-container-item/update-child-menu-item-container-item.dto';
import { CreateChildMenuItemContainerOptionsDto } from '../menu-item-container-options/create-child-menu-item-container-options.dto';
import { UpdateChildMenuItemContainerOptionsDto } from '../menu-item-container-options/update-child-menu-item-container-options.dto';

export class UpdateMenuItemDto {
    @ApiProperty({
        description: 'Id of MenuItemCategory entity. Pass a null value to remove category',
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly categoryId?: number | null;

    @ApiProperty({ description: 'Name of MenuItem entity.' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly itemName?: string;

    @ApiProperty({ description: 'Id of MenuItem entity that is the vegan version of the referencing MenuItem. Pass a null value to remove vegan option' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly veganOptionMenuId?: number | null;

    @ApiProperty({ description: 'Id of MenuItem entity that is the Take \'n Bake version of the referencing MenuItem. Pass a null value to remove take n bake option' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly takeNBakeOptionMenuId?: number | null;

    @ApiProperty({ description: 'Id of MenuItem entity that is the vegan Take \'n Bake version of the referencing MenuItem. Pass a null value to remove vegan take n bake option' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly veganTakeNBakeOptionMenuId?: number | null;

    @ApiProperty({
        description: 'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly validSizeIds?: number[];

    @ApiProperty({ description: 'Is Pie of the Month, monthly rotating special, relevant for Pie baking lists.' })
    @IsBoolean()
    @IsOptional()
    readonly isPOTM?: boolean;

    @ApiProperty({ description: 'Pie requires parbaked shells' })
    @IsBoolean()
    @IsOptional()
    readonly isParbake?: boolean;

    @ApiProperty({
        example: 'Creating a Breakfast Pastry Platter, Size: ____ , components would be created from the passed CreateChildMenutItemContainerItemDtos',
        description: 'Array of CreateChildMenutItemContainerItemDtos. Child dtos are used when creating a parent with child entities. Pass a null value to remove defined container',
        type: [UpdateChildMenuItemContainerItemDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MenuItemComponentUnionResolver)
    readonly definedContainerItemDtos?: (CreateChildMenuItemContainerItemDto | UpdateChildMenuItemContainerItemDto)[] | null;

    @ApiProperty({
        description: 'options for the menuItem if it serves as a container to other items. Sets rules like valid items and item sizes, and quantity of the container. Pass a null value to remove container options',
        type: UpdateChildMenuItemContainerOptionsDto
    })
    @IsOptional()
    readonly containerOptionDto?: CreateChildMenuItemContainerOptionsDto | UpdateChildMenuItemContainerOptionsDto | null;
}
