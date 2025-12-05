import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { recipeSubCategoryExample } from '../../../util/swagger-examples/recipes/recipe-sub-category.example';
import { recipeExample } from '../../../util/swagger-examples/recipes/recipe.example';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeSubCategory } from './recipe-sub-category.entity';
import { Recipe } from './recipe.entity';

export type RecipeCategoryEntity = EntityBase<
  RecipeCategory,
  CreateRecipeCategoryDto,
  UpdateRecipeCategoryDto
>;

/**
 * Category of {@link Recipe}
 *
 * Example: "Pie", "Pastry", "Drink"
 */
@Entity()
export class RecipeCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Pie', description: 'The name of the category' })
  @Column({ unique: true })
  categoryName: string;

  /**
   * {@link RecipeSubCategory} of "Pie" could be "Sweet Pie", "Savory Pie"
   */
  @ApiProperty({
    example: [recipeSubCategoryExample(new Set<string>(), true)],
    description: 'List of subcategories under the category',
    type: () => RecipeSubCategory,
    isArray: true,
  })
  @OneToMany(() => RecipeSubCategory, (sub) => sub.parentCategory, {
    cascade: true,
  })
  subCategories: RecipeSubCategory[] = [];

  /**
   * List of {@link Recipe} under the category.
   */
  @ApiProperty({
    example: [recipeExample(new Set<string>(), true)],
    description: 'List of recipes under the category',
    type: () => Recipe,
    isArray: true,
  })
  @OneToMany(() => Recipe, (recipe) => recipe.category)
  recipes: Recipe[] = [];
}
