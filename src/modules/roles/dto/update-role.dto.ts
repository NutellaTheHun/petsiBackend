import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRoleDto {
    @ApiProperty({
        description: 'Name of the Role entity.',
        example: 'manager',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
