import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsString,
    ValidateNested
} from 'class-validator';
import { NestedCreateTemplateMenuItemDto } from '../template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../template-menu-item/nested-update-template-menu-item.dto';

export class UpdateTemplateDto {
    @ApiProperty({
        description: 'Name of the Template entity.',
        example: 'Spring Pastries',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'TODO',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateTemplateMenuItemDto) },
            { $ref: getSchemaPath(NestedUpdateTemplateMenuItemDto) },
        ],
        example: [
            {
                createId: 'c1',
                displayName: 'CLAPPLE',
                menuItemId: 2,
                tablePosIndex: 0,
            },
            {
                id: 3,
                displayName: 'MIX',
                menuItemId: 4,
                tablePosIndex: 1,
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    readonly templateMenuItems: (
        | NestedCreateTemplateMenuItemDto
        | NestedUpdateTemplateMenuItemDto
    )[];
}
