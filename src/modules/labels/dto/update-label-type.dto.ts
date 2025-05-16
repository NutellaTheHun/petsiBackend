import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLabelTypeDto {
    @ApiProperty({ description: 'Name of the Label-Type entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsOptional()
    readonly labelLength?: number;

    @ApiProperty({ description: 'The length of the label type in hundreths of an inch' })
    @IsNumber()
    @IsOptional()
    readonly labelWidth?: number;
}