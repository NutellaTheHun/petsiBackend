import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTemplateMenuItemDto {
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

    @ApiProperty({ description: 'Id of the parent Template entity.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly templateId?: number;
}
