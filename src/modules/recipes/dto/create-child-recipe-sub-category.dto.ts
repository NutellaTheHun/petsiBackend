import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateChildRecipeSubCategoryDto {
    readonly mode: 'create' = 'create';
    
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}