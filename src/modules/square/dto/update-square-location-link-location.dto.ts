import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, ValidateIf } from 'class-validator';

export class UpdateSquareLocationLinkLocationDto {
    @ApiProperty({
        type: Number,
        nullable: true,
        example: 3,
        description:
            'Petsi location to map to; null unmaps (and disables) the link',
    })
    @ValidateIf(
        (dto: UpdateSquareLocationLinkLocationDto) => dto.locationId !== null,
    )
    @IsInt()
    @IsPositive()
    locationId: number | null;
}
