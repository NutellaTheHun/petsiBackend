import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateInventoryItemVendorDto {
    @ApiProperty({
        description: 'Name of InventoryItemVendor entity.',
        example: 'Driscols',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
