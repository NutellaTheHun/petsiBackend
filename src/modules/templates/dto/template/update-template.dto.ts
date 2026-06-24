import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested
} from 'class-validator';
import { NestedCreateTemplateMenuItemDto } from '../template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../template-menu-item/nested-update-template-menu-item.dto';

@ApiExtraModels(NestedCreateTemplateMenuItemDto, NestedUpdateTemplateMenuItemDto)
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
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateTemplateMenuItemDto, item)
                : plainToInstance(NestedUpdateTemplateMenuItemDto, item)
        );
    })
    readonly templateMenuItems?: (
        | NestedCreateTemplateMenuItemDto
        | NestedUpdateTemplateMenuItemDto
    )[];
}
