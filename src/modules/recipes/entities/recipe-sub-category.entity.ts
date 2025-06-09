import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { recipeCategoryExample } from '../../../util/swagger-examples/recipes/recipe-category.example';
import { recipeExample } from '../../../util/swagger-examples/recipes/recipe.example';
import { RecipeCategory } from './recipe-category.entity';
import { Recipe } from './recipe.entity';

/**
 * A category within a {@link RecipeCategory}
 *
 * Such as "Scone" or "Muffin" within the "Pastry" category.
 */
@Entity()
@Unique(['subCategoryName', 'parentCategory'])
export class RecipeSubCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Savory Pie',
    description: 'Name of the subcategory',
  })
  @Column({ nullable: false })
  subCategoryName: string;

  /**
   * The owning category
   *
   * For sub-categories "Sweet Pie" and "Savory Pie", "Pie" would be the parent {@link RecipeCategory}.
   */
  @ApiProperty({
    example: recipeCategoryExample(new Set<string>(), true),
    description: 'Category this subcategory is for',
    type: () => RecipeCategory,
  })
  @ManyToOne(() => RecipeCategory, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  parentCategory: RecipeCategory;

  /**
   * Recipes belonging to the sub-category.
   */
  @ApiProperty({
    example: [recipeExample(new Set<string>(), true)],
    description: 'List of Recipes under the subcategory',
    type: () => Recipe,
    isArray: true,
  })
  @OneToMany(() => Recipe, (recipe) => recipe.subCategory)
  recipes: Recipe[];
}
