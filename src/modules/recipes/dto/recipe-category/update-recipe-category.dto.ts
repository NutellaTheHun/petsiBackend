import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { NestedCreateRecipeSubCategoryDto } from '../recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../recipe-sub-category/nested-update-recipe-sub-category.dto';

@ApiExtraModels(NestedCreateRecipeSubCategoryDto, NestedUpdateRecipeSubCategoryDto)
export class UpdateRecipeCategoryDto {
    @ApiProperty({
        description: 'Name of the RecipeCategory entity.',
        example: 'Pies',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description:
            'Array of CreateChildRecipeSubCategoryDtos, child dtos are used when creating the parent RecipeCategory with child RecipeSubCategory entities.',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateRecipeSubCategoryDto) },
            { $ref: getSchemaPath(NestedUpdateRecipeSubCategoryDto) },
        ],
        example: [
            {
                createId: 'c1',
                name: 'savory pies',
            },
            {
                id: 2,
                name: 'sweet pies',
            },
        ],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateRecipeSubCategoryDto, item)
                : plainToInstance(NestedUpdateRecipeSubCategoryDto, item)
        );
    })
    readonly subCategories?: (
        | NestedCreateRecipeSubCategoryDto
        | NestedUpdateRecipeSubCategoryDto
    )[];
}
