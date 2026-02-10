import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
} from 'class-validator';
import { EntityId } from '../../../common/types';
import { Role } from '../../roles/entities/role.entity';

export class UpdateUserDto {
    @ApiProperty({ description: '', example: 'jsmith123' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: '', example: 'strongPassword1234' })
    @IsString()
    @IsNotEmpty()
    readonly password: string;

    @ApiProperty({
        description: '',
        example: 'jjsmithy@email.com',
        type: 'string',
        format: 'email',
    })
    @IsString()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({
        description: 'Id of roles the user has.',
        example: [1, 2],
        type: 'number',
        isArray: true,
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsNotEmpty()
    @Type(() => Number)
    readonly roleIds: EntityId<Role>[];
}
