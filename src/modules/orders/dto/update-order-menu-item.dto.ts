import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateOrderMenuItemDto {
    @ApiProperty({ description: 'Id of Menu-Item entity being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId?: number

    @ApiProperty({ description: 'Id of the Menu-Item-Size entity. Must be valid size for the Menu-Item being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemSizeId?: number

    @ApiProperty({ description: 'Amount being ordered.' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly quantity?: number
}
