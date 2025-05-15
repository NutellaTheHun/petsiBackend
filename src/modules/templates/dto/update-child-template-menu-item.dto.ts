import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateChildTemplateMenuItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Template entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the TemplateMenuItem entity to be updated.' })
    @IsPositive()
    @IsNumber()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ example: 'MenuItem: Blueberry Pie, displayName: "blue"', description: 'Name to be used on the baking list representing the referenced Menu-Item.' })
    @IsString()
    @IsOptional()
    readonly displayName?: string;

    @ApiProperty({ description: 'Id of the Menu-Item entity being displayed on the Template.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId?: number;

    @ApiProperty({ description: 'The row position of the Template-Menu-Item on the parent Template.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly tablePosIndex?: number;
}
