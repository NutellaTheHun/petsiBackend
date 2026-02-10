import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMenuItemCategoryDto {
    @ApiProperty({
        example: 'Pie',
        description: 'Name of the MenuItemCategory.',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
