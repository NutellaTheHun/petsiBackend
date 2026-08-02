import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../common/types';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entities';

export class CreateUserLocationDto {
    @ApiProperty({
        description: 'Id of the User being assigned to the location.',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    readonly userId: EntityId<User>;

    @ApiProperty({
        description: 'Id of the Location the user is being assigned to.',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    readonly locationId: number;

    @ApiPropertyOptional({
        description: 'Ids of the roles the user holds at this location.',
        example: [1, 2],
        type: 'number',
        isArray: true,
    })
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly roleIds?: EntityId<Role>[];
}
