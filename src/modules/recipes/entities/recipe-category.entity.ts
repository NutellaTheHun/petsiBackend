import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeSubCategory } from "./recipe-sub-category.entity";
import { Recipe } from "./recipe.entity";

/**
 * Category of {@link Recipe} 
 * 
 * Example: "Pie", "Pastry", "Drink"
 */
@Entity()
export class RecipeCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    categoryName: string;

    /**
     * {@link RecipeSubCategory} of "Pie" could be "Sweet Pie", "Savory Pie"
     */
    @OneToMany(() => RecipeSubCategory, (sub) => sub.parentCategory, { cascade: true })
    subCategories: RecipeSubCategory[];

    /**
     * List of {@link Recipe} under the category.
     */
    @OneToMany(() => Recipe, (recipe) => recipe.category)
    recipes: Recipe[];
}