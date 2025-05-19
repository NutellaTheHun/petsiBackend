import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { RecipeIngredientUnionResolver } from "../../utils/recipe-ingredient-union-resolver";
import { CreateChildRecipeSubCategoryDto } from "../recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateRecipeCategoryDto{
    @ApiProperty({ description: 'Name of the Recipe-Category entity.' })
    @IsString()
    @IsOptional()
    readonly categoryName?: string;

    @ApiProperty({ description: 'Mixed array of CreateChildRecipeSubCategoryDtos and UpdateChildRecipeSubCategoryDtos, child dtos are used when updating the parent Recipe-Category with created/updated child Recipe-Sub-Category entities.',
        type: [UpdateChildRecipeSubCategoryDto]
     })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientUnionResolver)
    readonly subCategoryDtos?: (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[];
}