import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateLabelTypeDto {
    @ApiProperty({ description: 'Name of the Label-Type entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
