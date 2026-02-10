import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateInventoryItemPackageDto {
    @ApiProperty({
        example: 'Can',
        description: 'Name for InventoryItemPackage entity.',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
