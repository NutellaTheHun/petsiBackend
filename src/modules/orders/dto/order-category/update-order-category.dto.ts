import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderCategoryDto {
    @ApiProperty({ example: 'Wholesale, Special, Square', description: 'Name of the Order-Category entity.' })
    @IsString()
    @IsOptional()
    readonly categoryName?: string;
}