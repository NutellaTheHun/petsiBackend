import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateInventoryAreaDto {
    @ApiProperty({
        description: 'Name of the inventory area.',
        example: 'Dry Storage',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Id of the Location this area belongs to.',
        example: 1,
    })
    @IsInt()
    readonly locationId: number;
}
