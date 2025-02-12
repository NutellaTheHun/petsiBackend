import { MenuItem } from "src/modules/menu-items/entities/menu-item.entity";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecipeIngredient } from "./recipe-ingredient.entity";
import { RecipeCategory } from "./recipe-category.entity";
import { RecipeSubCategory } from "./recipe-sub-category.entity";
import { UnitOfMeasure } from "src/modules/unit-of-measure/entities/unit-of-measure.entity";

@Entity()
export class Recipe{
    @PrimaryGeneratedColumn()
    id: number;

    /** 
     * The MenuItem that this recipe creates, some recipes are "prep" and are a sub-recipe to another Recipe
     * - If the MenuItem is deleted, the recipe is also deleted "onDelete: CASCADE" 
     */
    @OneToOne(() => MenuItem, {nullable: true, onDelete: 'CASCADE'})
    menuItem?: MenuItem;

    /*
    * A recipe with isIngredient set to true doesn't directly make a MenuItem,
    * but is an ingredient to another recipe.
    * - Recipe "Apple Mix", is not a direct MenuItem, but is an ingredient to Recipes such as "Classic Apple", "Apple Crumb"
    */
    @Column({ default: false })
    isIngredient: boolean;

    @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, { nullable: false, cascade: true })
    ingredients: RecipeIngredient[] = [];

    @Column({ nullable: false })
    batchResultQuantity: number;

    @Column({ nullable: false })
    batchResultUnitOfMeasure: UnitOfMeasure;

    @Column({ nullable: false })
    servingSizeQuantity: number;

    @Column({ nullable: false })
    servingSizeUnitOfMeasure: UnitOfMeasure;

    // cost per serving calculated

    // sales price per serving calculated

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    salesPrice: number = 0;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    cost: number = 0;

    @ManyToOne(() => RecipeCategory, (category) => category.recipes, { nullable: true, onDelete: 'SET NULL'})
    category?: RecipeCategory;

    @ManyToOne(() => RecipeSubCategory, (subCategory) => subCategory.recipes, { nullable: true, onDelete: 'SET NULL' })
    subCategory?: RecipeSubCategory;
}