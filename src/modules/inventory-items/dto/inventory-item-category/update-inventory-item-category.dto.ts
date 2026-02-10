import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateInventoryItemCategoryDto {
    @ApiProperty({
        example: 'Dry Goods',
        description: 'Name of InventoryItemCategory entity.',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
