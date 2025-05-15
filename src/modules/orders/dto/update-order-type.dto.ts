import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateOrderTypeDto {
    @ApiProperty({ example: 'Wholesale, Special, Square', description: 'Name of the Order-Type entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'An array of Order ids who fall under the referencing Order-Type' })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    @IsOptional()
    readonly orderIds?: number[];
}