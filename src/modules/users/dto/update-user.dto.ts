import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ description: '', example: 'jsmith123' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: '', example: 'strongPassword1234' })
    @IsString()
    @IsOptional()
    readonly password?: string;

    @ApiProperty({
        description: '',
        example: 'jjsmithy@email.com',
        type: 'string',
        format: 'email',
    })
    @IsString()
    @IsOptional()
    readonly email: string | null;

    @ApiPropertyOptional({
        description: 'Grants access to every location under the tenant without a per-location UserLocation assignment.',
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    readonly isTenantAdmin?: boolean;
}
