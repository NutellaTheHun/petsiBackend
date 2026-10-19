import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
    @ApiProperty({
        description: 'Name of the Location entity.',
        example: 'Downtown',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiPropertyOptional({
        description: 'Street address of the location.',
        example: '1 Broken Dreams Blvd',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly address?: string;

    @ApiPropertyOptional({
        description: 'Contact phone number for the location.',
        example: '555-420-6969',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly phoneNumber?: string;

    @ApiPropertyOptional({
        description: 'Contact email for the location.',
        example: 'downtown@petsi.com',
        nullable: true,
        format: 'email',
    })
    @IsEmail()
    @IsOptional()
    readonly email?: string;
}
