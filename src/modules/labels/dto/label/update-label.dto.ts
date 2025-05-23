import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateLabelDto {
    @ApiProperty({ description: 'Id of Menu-Item entity.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly menuItemId?: number;

    @ApiProperty({ description: 'URL to image on offsite storage.' })
    @IsString()
    @IsOptional()
    readonly imageUrl?: string;

    @ApiProperty({ description: 'Id of Label-Type entity.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly labelTypeId?: number;
}
