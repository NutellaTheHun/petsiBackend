import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSquareLocationLinkEnabledDto {
    @ApiProperty({
        example: true,
        description: 'Enabling requires a mapped Petsi location',
    })
    @IsBoolean()
    enabled: boolean;
}
