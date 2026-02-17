import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsString,
    ValidateNested
} from 'class-validator';
import { NestedCreateTemplateMenuItemDto } from '../template-menu-item/nested-create-template-menu-item.dto';

export class CreateTemplateDto {
    @ApiProperty({
        description: 'Name of the Template entity.',
        example: 'Summer Pies',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiPropertyOptional({
        description: 'TODO',
        type: [NestedCreateTemplateMenuItemDto],
        example: [
            {
                createId: 'c1',
                displayName: 'CLAPPLE',
                menuItemId: 2,
                tablePosIndex: 0,
            },
            {
                createId: 'c3',
                displayName: 'MIX',
                menuItemId: 4,
                tablePosIndex: 1,
            },
        ],
    })
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    readonly templateMenuItems: NestedCreateTemplateMenuItemDto[];
}
