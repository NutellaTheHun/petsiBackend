import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateLabelTypeDto {
    @ApiProperty({ description: 'Name of the LabelType entity.' })
    @IsString()
    @IsNotEmpty()
    readonly labelTypeName: string;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsNotEmpty()
    readonly labelTypeLength: number;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsNotEmpty()
    readonly labelTypeWidth: number;
}
