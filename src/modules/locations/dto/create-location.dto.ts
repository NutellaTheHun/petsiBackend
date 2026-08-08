import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { EntityId } from '../../../common/types';
import { Tenant } from '../../tenants/entities/tenant.entity';

export class CreateLocationDto {
    @ApiProperty({
        description: 'Id of the Tenant entity this Location belongs to.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    readonly tenantId: EntityId<Tenant>;

    @ApiProperty({ description: 'Name of the Location entity.', example: 'Downtown' })
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
