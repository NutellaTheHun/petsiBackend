import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SettingValue } from '../utils/setting-value.util';

export class CreateSettingDto {
    @ApiPropertyOptional({
        description: 'Id of the Location this setting overrides. Omit to write the tenant-wide default.',
        example: 1,
    })
    @IsOptional()
    @IsInt()
    readonly locationId?: number;

    @ApiProperty({
        description: 'Setting key. Must be a name registered in the backend SettingKey registry.',
        example: 'taxRate',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Value for the setting. Its type must match the SettingKey registry\'s declared valueType for `name` (string, number, boolean, or a JSON object/array).',
        example: 0.08,
    })
    @IsDefined()
    readonly value: SettingValue;
}
