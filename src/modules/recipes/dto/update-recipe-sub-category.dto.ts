import { PartialType } from "@nestjs/mapped-types";
import { CreateRecipeSubCategoryDto } from "./create-recipe-sub-category.dto";

export class UpdateRecipeSubCategoryDto extends PartialType(CreateRecipeSubCategoryDto){}