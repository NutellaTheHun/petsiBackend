import { MenuItem } from "src/modules/menu-items/entities/menu-item.entity";
import { Column, Double, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecipeIngredient } from "./recipe-ingredient.entity";

@Entity()
export class Recipe{
    @PrimaryGeneratedColumn()
    id: number;

    /** 
     * The MenuItem that this recipe creates, some recipes are "prep" and are a sub-recipe to another Recipe 
     */
    @OneToOne(() => MenuItem, (item) => item.recipe, {nullable: true})
    product: MenuItem;

    /*
    * A recipe with isIngredient set to true doesn't directly make a MenuItem,
    * but is an ingredient to another recipe.
    * - Recipe "Apple Mix", is not a direct MenuItem, but is an ingredient to Recipes such as "Classic Apple", "Apple Crumb"
    */
    @Column()
    isIngredient: boolean;

    @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe)
    ingredients: RecipeIngredient[] = [];

    // needs entity?
    // yield?, serving size?, cost per serving?, sales price per serving?
    @Column()
    batchSize: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    salesPrice: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    cost: number;

    // needs entity
    @Column()
    category: string;

    // needs entity
    @Column()
    subCategory: string;
}