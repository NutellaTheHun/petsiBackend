import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateLabelDto {
    @ApiProperty({ description: 'Id of Menu-Item entity.' })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly menuItemId: number;

    @ApiProperty({ description: 'URL to image on offsite storage.' })
    @IsString()
    @IsNotEmpty()
    readonly imageUrl: string;

    @ApiProperty({ description: 'Id of Label-Type entity.' })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly typeId: number;
}
