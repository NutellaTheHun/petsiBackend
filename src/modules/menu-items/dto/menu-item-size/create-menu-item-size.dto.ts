import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateMenuItemSizeDto {
    @ApiProperty({
        example: 'Small, Medium, Large, Regular',
        description: 'Name of MenuItemSize entity.'
    })
    @IsString()
    @IsNotEmpty()
    readonly sizeName: string;
}