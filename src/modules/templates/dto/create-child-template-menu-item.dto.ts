import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateChildTemplateMenuItemDto {
        @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Template entity.' })
        @IsNotEmpty()
        readonly mode: 'create' = 'create';

        @ApiProperty({ example: 'MenuItem: Blueberry Pie, displayName: "blue"', description: 'Name to be used on the baking list representing the referenced Menu-Item.' })
        @IsString()
        @IsNotEmpty()
        readonly displayName: string;

        @ApiProperty({ description: 'Id of the Menu-Item entity being displayed on the Template.' })
        @IsNumber()
        @IsNotEmpty()
        @IsPositive()
        readonly menuItemId: number;

        @ApiProperty({ description: 'The row position of the Template-Menu-Item on the parent Template.' })
        @IsNumber()
        @IsNotEmpty()
        @IsPositive()
        readonly tablePosIndex: number;
}