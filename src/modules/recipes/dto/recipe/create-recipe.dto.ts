import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { AppUnit, UNITS } from '../../../../common/units';
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { RecipeCategory } from '../../entities/recipe-category.entity';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { NestedCreateRecipeIngredientDto } from '../recipe-ingredient/nested-create-recipe-ingredient.dto';

export class CreateRecipeDto {
    @ApiProperty({
        description: 'Name of the Recipe entity.',
        example: 'Blueberry Pie',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Id of the MenuItem that the recipe produces.',
        example: 1,
        type: Number,
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly producedMenuItemId?: EntityId<MenuItem> | null;

    @ApiPropertyOptional({
        description: 'The unit amount the recipe produces.',
        example: 2,
        type: 'number',
        format: 'decimal',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultQuantity?: number | null;

    @ApiProperty({
        description: 'Unit symbol expressing the unit size of what the recipe produces.',
        example: 'oz',
        nullable: true,
    })
    @IsIn(Object.values(UNITS))
    @IsOptional()
    readonly batchResultUnit?: AppUnit | null;

    @ApiProperty({
        description: 'The unit amount of the servingSizeUnit describing the amount that is sold.',
        example: 4,
        type: 'number',
        format: 'decimal',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeQuantity?: number | null;

    @ApiProperty({
        description: 'Unit symbol representing the unit size of what is sold.',
        example: 'oz',
        nullable: true,
    })
    @IsIn(Object.values(UNITS))
    @IsOptional()
    readonly servingSizeUnit?: AppUnit | null;

    @ApiProperty({
        description: 'The price of purchasing the serving size amount.',
        example: 6,
        type: 'number',
        format: 'decimal',
        nullable: true,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    readonly salesPrice?: number | null;

    @ApiProperty({
        description: 'If the recipe is used as an ingredient.(Not sold directly)',
        example: false,
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly isIngredient: boolean;

    @ApiProperty({
        description: 'Id of the RecipeCategory entity',
        example: 7,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly categoryId?: EntityId<RecipeCategory> | null;

    @ApiProperty({
        description:
            'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
        example: 8,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: EntityId<RecipeSubCategory> | null;

    @ApiProperty({
        description: 'Array of CreateRecipeIngredientDto.',
        type: [NestedCreateRecipeIngredientDto],
        example: [
            {
                createId: 'c1',
                ingredientInventoryItemId: 2,
                quantity: 3,
                unit: 'oz',
            },
            {
                createId: 'c5',
                ingredientRecipeId: 5,
                quantity: 6,
                unit: 'oz',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NestedCreateRecipeIngredientDto)
    readonly ingredients: NestedCreateRecipeIngredientDto[];
}
