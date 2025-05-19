import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateLabelTypeDto {
    @ApiProperty({ description: 'Name of the Label-Type entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsNotEmpty()
    readonly labelLength: number;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsNotEmpty()
    readonly labelWidth: number;
}
