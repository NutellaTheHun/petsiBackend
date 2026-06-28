import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class DynamicPropertyValueDto {
    @ApiProperty({ description: 'ID of the DynamicPropertyConfig', example: 1 })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly configId: number;

    @ApiProperty({
        description: 'Value to store; null to clear the existing value',
        example: '42',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    readonly value: string | null;
}
