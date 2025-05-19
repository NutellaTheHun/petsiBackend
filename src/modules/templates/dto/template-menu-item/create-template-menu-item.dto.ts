import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { Template } from "../../entities/template.entity";

/**
 * Depreciated, only created as a child through {@link Template}.
 */
export class CreateTemplateMenuItemDto {
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

        @ApiProperty({ description: 'Id of the parent Template entity.' })
        @IsNumber()
        @IsNotEmpty()
        @IsPositive()
        readonly templateId: number;
}