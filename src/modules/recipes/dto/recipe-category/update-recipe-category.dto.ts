import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { NestedCreateRecipeSubCategoryDto } from '../recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../recipe-sub-category/nested-update-recipe-sub-category.dto';

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
    readonly subCategories?: (
        | NestedCreateRecipeSubCategoryDto
        | NestedUpdateRecipeSubCategoryDto
    )[];
}
