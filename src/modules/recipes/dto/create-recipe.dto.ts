import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class CreateRecipeDto {

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @IsBoolean()
    readonly isIngredient: boolean;

    @IsArray()
    @IsNumber({},{ each: true})
    @IsPositive({ each: true })
    readonly ingredientIds: number[] = [];

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly batchResultQuantity: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()  
    readonly batchResultUnitOfMeasureId: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()   
    readonly servingSizeQuantity: number;
    
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()    
    readonly servingSizeUnitOfMeasureId: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    readonly salesPrice: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    readonly cost: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly categoryId?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: number;
}