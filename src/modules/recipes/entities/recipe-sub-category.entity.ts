import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RecipeCategory } from "./recipe-category.entity";
import { Recipe } from "./recipe.entity";

@Entity()
export class RecipeSubCategory{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @ManyToOne(() => RecipeCategory, { nullable: false, onDelete: 'CASCADE' })
    parentCategory: RecipeCategory;

    @OneToMany(() => Recipe, (recipe) => recipe.category, { nullable: false, onDelete: 'SET NULL' })
    recipes: Recipe[];
}