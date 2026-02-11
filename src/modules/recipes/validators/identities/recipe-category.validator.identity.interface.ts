import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";
import { RecipeSubCategoryValidatorIdentity } from "./recipe-sub-category.validator.identity.interface";

export interface RecipeCategoryValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly name?: string;
    readonly subCategories?: RecipeSubCategoryValidatorIdentity[];
}