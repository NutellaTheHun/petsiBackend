import { PartialType } from "@nestjs/mapped-types";
import { CreateRecipeCategoryDto } from "./create-recipe-category.dto";

export class UpdateRecipeCategoryDto extends PartialType(CreateRecipeCategoryDto){}