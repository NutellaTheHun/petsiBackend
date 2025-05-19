import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { RecipeCategory } from "./recipe-category.entity";
import { Recipe } from "./recipe.entity";

/**
 * A category within a {@link RecipeCategory}
 * 
 * Such as "Scone" or "Muffin" within the "Pastry" category.
 */
@Entity()
@Unique(['subCategoryName', 'parentCategory'])
export class RecipeSubCategory{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    subCategoryName: string;

    /**
     * The owning category
     * 
     * For sub-categories "Sweet Pie" and "Savory Pie", "Pie" would be the parent {@link RecipeCategory}.
     */
    @ManyToOne(() => RecipeCategory, { nullable: true, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    parentCategory: RecipeCategory;

    /**
     * Recipes belonging to the sub-category.
     */
    @OneToMany(() => Recipe, (recipe) => recipe.subCategory)
    recipes: Recipe[];
}