import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { RecipeIngredientUnionResolver } from "../../utils/recipe-ingredient-union-resolver";
import { CreateChildRecipeSubCategoryDto } from "../recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../recipe-sub-category/update-child-recipe-sub-category.dto copy";

export class UpdateRecipeCategoryDto {
    @ApiProperty({ description: 'Name of the RecipeCategory entity.' })
    @IsString()
    @IsOptional()
    readonly categoryName?: string;

    @ApiProperty({
        description: 'Mixed array of CreateChildRecipeSubCategoryDtos and UpdateChildRecipeSubCategoryDtos, child dtos are used when updating the parent RecipeCategory with created/updated child RecipeSubCategory entities.',
        type: [UpdateChildRecipeSubCategoryDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientUnionResolver)
    readonly subCategoryDtos?: (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[];
}