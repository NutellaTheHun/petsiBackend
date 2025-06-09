import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { inventoryItemExample } from '../../../util/swagger-examples/inventory-items/inventory-item.example';
import { recipeExample } from '../../../util/swagger-examples/recipes/recipe.example';
import { unitOfMeasureExample } from '../../../util/swagger-examples/unit-of-measure/unit-of-measure.example';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { Recipe } from './recipe.entity';

/**
 * A ingredient within a {@link Recipe}, can either be an {@link InventoryItem} or another {@link Recipe}.
 */
@Entity()
export class RecipeIngredient {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent {@link Recipe} to the ingredient.
   *
   */
  @ApiProperty({
    example: recipeExample(new Set<string>(), true),
    description: 'Recipe the ingredient is for',
    type: () => Recipe,
  })
  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  parentRecipe: Recipe;

  /**
   * The {@link InventoryItem} that is being used as the ingredient.
   *
   * - Example:  "flour" or "pecan halves"
   *
   * If a RecipeIngredient is referencing the inventoryItem property, the subRecipeIngredient property must be null/undefined.
   */
  @ApiPropertyOptional({
    example: inventoryItemExample(new Set<string>(), true),
    description:
      'The InventoryItem this ingredient uses, if this property is referenced, ingredientRecipe property must be null.',
    type: InventoryItem,
  })
  @ManyToOne(() => InventoryItem, { nullable: true, onDelete: 'CASCADE' })
  ingredientInventoryItem?: InventoryItem | null;

  /**
   * A {@link Recipe} that is used as an ingredient in the parent recipe property.
   *
   * Recipes such as "Apple Mix" or "Pie Dough"
   *
   * A subRecipe is a Recipe with isIngredient marked true
   *
   * If a RecipeIngredient is referencing the subRecipeIngredient property, the inventoryItem property must be null/undefined.
   */
  @ApiPropertyOptional({
    example: null,
    description:
      'The Recipe this ingredient uses, if this property is referenced, ingredientInventoryItem must be null.',
    type: () => Recipe,
  })
  @ManyToOne(() => Recipe, { nullable: true, onDelete: 'CASCADE' })
  ingredientRecipe?: Recipe | null;

  /**
   * the amount of the unit property for the referenced inventoryItem/subRecipeIngredient property.
   *
   * Example: 3(quantity) cups of Flour
   */
  @ApiProperty({
    example: '3.5',
    description:
      'the numberical value of the quantityMeasure property of the ingredient',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  quantity: number;

  /**
   * The choice of measurement for the ingredient.
   *
   * Example: 3 cups({@link UnitOfMeasure}) of Flour
   */
  @ApiProperty({
    example: unitOfMeasureExample(new Set<string>(), false),
    description: 'The unit of measure for the ingredient',
    type: UnitOfMeasure,
  })
  @ManyToOne(() => UnitOfMeasure, { nullable: false, onDelete: 'CASCADE' })
  quantityMeasure: UnitOfMeasure;
}
