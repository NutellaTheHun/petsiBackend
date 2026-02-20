import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
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
        description:
            'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.',
        example: 1,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultQuantity?: number | null;

    @ApiProperty({
        description:
            'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
        example: 2,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultUnitTypeId?: EntityId<UnitOfMeasure> | null;

    @ApiProperty({
        description:
            'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
        example: 3,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeQuantity?: number | null;

    @ApiProperty({
        description:
            'Id of the UnitofMeasure used to represent the unit size of what is sold.',
        example: 4,
        type: 'number',
        nullable: true,
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeUnitTypeId?: EntityId<UnitOfMeasure> | null;

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
                quantityUnitTypeId: 4,
            },
            {
                createId: 'c5',
                ingredientRecipeId: 5,
                quantity: 6,
                quantityUnitTypeId: 7,
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateRecipeIngredientDto, item)
                : plainToInstance(NestedUpdateRecipeIngredientDto, item)
        );
    })
    readonly ingredients: (
        | NestedCreateRecipeIngredientDto
        | NestedUpdateRecipeIngredientDto
    )[];
}
