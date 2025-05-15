import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateChildOrderMenuItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Order entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of child Order-Menu-Item to be updated' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

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
