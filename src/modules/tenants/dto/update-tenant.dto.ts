import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTenantDto {
    @ApiProperty({ description: 'Name of the Tenant entity.', example: 'Petsi Pies' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Unique subdomain the Tenant is resolved from (e.g. tenant1.app.com).',
        example: 'petsi',
    })
    @IsString()
    @IsNotEmpty()
    readonly subdomain: string;
}
