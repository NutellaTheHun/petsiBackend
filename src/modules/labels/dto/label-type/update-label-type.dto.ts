import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLabelTypeDto {
    @ApiProperty({ description: 'Name of the Label-Type entity.' })
    @IsString()
    @IsOptional()
    readonly labelTypeName?: string;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsOptional()
    readonly labelTypeLength?: number;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsOptional()
    readonly labelTypeWidth?: number;
}