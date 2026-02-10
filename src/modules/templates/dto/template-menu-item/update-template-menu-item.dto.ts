import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';

export class UpdateTemplateMenuItemDto {
    @ApiProperty({
        description:
            'Name to be used on the baking list representing the referenced MenuItem.',
        example: 'POTM',
    })
    @IsString()
    @IsNotEmpty()
    readonly displayName: string;

    @ApiProperty({
        description:
            'The row position of the TemplateMenuItem on the parent Template.',
        example: 2,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly tablePosIndex: number;

    @ApiProperty({
        description: 'Id of the MenuItem entity being displayed on the Template.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemId: EntityId<MenuItem>;

    /*@ApiPropertyOptional({
      description: 'Id of the parent Template entity.',
      example: 3,
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly parentTemplateId?: EntityId<Template>;*/
}
