import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeSubCategory } from "./recipe-sub-category.entity";
import { Recipe } from "./recipe.entity";

@Entity()
export class RecipeCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @OneToMany(() => RecipeSubCategory, (sub) => sub.parentCategory, { nullable: true })
    subCategories?: RecipeSubCategory[] | null;

    @OneToMany(() => Recipe, (recipe) => recipe.category, { nullable: false })
    recipes: Recipe[];
}