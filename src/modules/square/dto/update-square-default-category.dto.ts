import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, ValidateIf } from 'class-validator';

export class UpdateSquareDefaultCategoryDto {
    @ApiProperty({
        type: Number,
        nullable: true,
        example: 3,
        description: 'Order category for imported orders; null clears it',
    })
    @ValidateIf(
        (dto: UpdateSquareDefaultCategoryDto) => dto.orderCategoryId !== null,
    )
    @IsInt()
    @IsPositive()
    orderCategoryId: number | null;
}
