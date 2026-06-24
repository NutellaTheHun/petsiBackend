import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
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
import { NestedUpdateRecipeIngredientDto } from '../recipe-ingredient/nested-update-recipe-ingedient.dto';

export class UpdateRecipeDto {
    @ApiProperty({
        description: 'Name of the Recipe entity.',
        example: 'Blueberry Pie',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'Id of the MenuItem that the recipe produces.',
        example: 'Blueberry Pie',
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly producedMenuItemId?: EntityId<MenuItem> | null;

    @ApiProperty({
        description: 'The unit amount the recipe produces.',
        example: 1,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultQuantity?: number | null;

    @ApiProperty({
        description: 'Unit symbol expressing the unit size of what the recipe produces.',
        example: 'oz',
        type: 'string',
        nullable: true,
    })
    @IsIn(Object.values(UNITS))
    @IsOptional()
    readonly batchResultUnit?: AppUnit | null;

    @ApiProperty({
        description: 'The unit amount of the servingSizeUnit describing the amount that is sold.',
        example: 3,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeQuantity?: number | null;

    @ApiProperty({
        description: 'Unit symbol representing the unit size of what is sold.',
        example: 'oz',
        type: 'string',
        nullable: true,
    })
    @IsIn(Object.values(UNITS))
    @IsOptional()
    readonly servingSizeUnit?: AppUnit | null;

    @ApiProperty({
        description: 'The price of purchasing the serving size amount.',
        example: 5.99,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
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
        example: 6,
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
        example: 7,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: EntityId<RecipeSubCategory> | null;

    @ApiProperty({
        description: 'TODO',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateRecipeIngredientDto) },
            { $ref: getSchemaPath(NestedUpdateRecipeIngredientDto) },
        ],
        example: [
            {
                id: 1,
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
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateRecipeIngredientDto, item)
                : plainToInstance(NestedUpdateRecipeIngredientDto, item)
        );
    })
    readonly ingredients?: (
        | NestedCreateRecipeIngredientDto
        | NestedUpdateRecipeIngredientDto
    )[];
}
