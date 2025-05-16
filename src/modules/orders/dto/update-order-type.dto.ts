import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateOrderTypeDto {
    @ApiProperty({ example: 'Wholesale, Special, Square', description: 'Name of the Order-Type entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;
}