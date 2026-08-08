import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { SettingValue } from '../utils/setting-value.util';

/**
 * `name` and `locationId` are the identity of a Setting row and are
 * immutable after creation — to change which key/location a value applies
 * to, create a new row and delete the old one. Only `value` can be updated.
 */
export class UpdateSettingDto {
    @ApiProperty({
        description: 'New value for the setting. Its type must match the SettingKey registry\'s declared valueType for this setting\'s `name`.',
        example: 0.0825,
    })
    @IsDefined()
    readonly value: SettingValue;
}
