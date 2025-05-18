import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateChildMenuItemComponentDto } from "../menu-item-component/create-child-menu-item-component.dto";
import { CreateChildMenuItemComponentOptionsDto } from "../menu-item-component-options/create-child-menu-item-component-options.dto";

export class CreateMenuItemDto {
    @ApiProperty({ description: 'Id of Menu-Item-Category entity.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly categoryId?: number;

    @ApiProperty({ description: 'Name of Menu-Item entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: 'Id of Menu-Item entity that is the vegan version of the referencing Menu-Item.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly veganOptionMenuId?: number;

    @ApiProperty({ description: 'Id of Menu-Item entity that is the Take \'n Bake version of the referencing Menu-Item.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly takeNBakeOptionMenuId?: number;

    @ApiProperty({ description: 'Id of Menu-Item entity that is the vegan Take \'n Bake version of the referencing Menu-Item.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly veganTakeNBakeOptionMenuId?: number;

    @ApiProperty({ description: 'Ids of Menu-Item-Size entities. Represents the sizes available for the referencing Menu-Item.' })
    @IsArray()
    @IsNumber({},{ each: true})
    @IsPositive({ each: true})
    @IsNotEmpty()
    readonly validSizeIds: number[];

    @ApiProperty({ description: 'Is Pie of the Month, monthly rotating special, relevant for Pie baking lists.' })
    @IsBoolean()
    @IsOptional()
    readonly isPOTM?: boolean;

    @ApiProperty({ description: 'Pie requires parbaked shells' })
    @IsBoolean()
    @IsOptional()
    readonly isParbake?: boolean;

    @ApiProperty({ example: 'Creating a Breakfast Pastry Platter, Size: ____ , components would be created from the passed CreateChildMenutItemComponentDtos', description: 'Array of CreateChildMenuItemComponentDtos. Child dtos are used when creating a parent with child entities.',
        type: [CreateChildMenuItemComponentDto]
     })
    @IsOptional()
    @IsArray()
    readonly containerComponentDtos?: CreateChildMenuItemComponentDto[];

    @ApiProperty({ description: 'options for the menuItem if it serves as a container to other items. Sets rules like valid items and item sizes, and quantity of the container.', 
        type: [CreateChildMenuItemComponentOptionsDto]
    })
    @IsOptional()
    readonly containerOptionDto?: CreateChildMenuItemComponentOptionsDto;
}
