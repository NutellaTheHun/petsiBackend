import { Type } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsPositive, IsBoolean, IsArray, Min, ValidateNested } from "class-validator";

export class UpdateRecipeDto{
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @IsBoolean()
    @IsOptional()
    readonly isIngredient?: boolean;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultQuantity?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultUnitOfMeasureId?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeQuantity?: number;
    
    @IsNumber()
    @IsPositive()
    @IsOptional()   
    readonly servingSizeUnitOfMeasureId?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly salesPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly cost?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly categoryId?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: number;

    @ValidateNested({ each: true })
    @Type(() => UpdateRecipeIngredientInput)
    @IsArray()
    @IsOptional()
    readonly ingredientInputs: UpdateRecipeIngredientInput[] = [];
}

class UpdateRecipeIngredientInput {
    @IsOptional()
    readonly id?: number;
  
    @IsOptional()
    readonly inventoryItemId?: number;
  
    @IsOptional()
    readonly subRecipeId?: number;
  
    @IsNumber()
    @IsOptional()
    readonly quantity?: number;
  
    @IsNumber()
    @IsOptional()
    readonly unitId?: number;
  }