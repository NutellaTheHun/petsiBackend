import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderCategoryDto {
    @ApiProperty({ example: 'Wholesale, Special, Square', description: 'Name of the OrderCategory entity.' })
    @IsString()
    @IsOptional()
    readonly categoryName?: string;
}