import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive, IsNotEmpty } from "class-validator";

export class CreateChildMenuItemContainerRuleDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating a Menu-Item-Container-Options entity.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({ description: 'Id of a Menu-Item entity that is a valid component' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    validMenuItemId: number;

    @ApiProperty({ description: 'Id of a Menu-Item-Size entity that is a valid size to the validMenuItem, and to the container' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    validSizeIds: number[];
}