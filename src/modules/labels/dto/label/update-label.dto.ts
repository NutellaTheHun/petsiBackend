import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { LabelType } from '../../entities/label-type.entity';

export class UpdateLabelDto {
    @ApiProperty({
        description: 'URL to image on offsite storage.',
        example: 'url/image.com',
    })
    @IsString()
    @IsNotEmpty()
    readonly imageUrl: string;

    @ApiProperty({
        description: 'Id of MenuItem entity.',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly menuItemId: EntityId<MenuItem>;

    @ApiProperty({
        description: 'Id of LabelType entity.',
        example: 2,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly labelTypeId: EntityId<LabelType>;
}
