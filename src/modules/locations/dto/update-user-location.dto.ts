import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { EntityId } from '../../../common/types';
import { Role } from '../../roles/entities/role.entity';

export class UpdateUserLocationDto {
    @ApiProperty({
        description: 'Id of the Location the user is assigned to.',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    readonly locationId: number;

    @ApiProperty({
        description: 'Ids of the roles the user holds at this location.',
        example: [1, 2],
        type: 'number',
        isArray: true,
    })
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    @IsNotEmpty()
    @Type(() => Number)
    readonly roleIds: EntityId<Role>[];
}
