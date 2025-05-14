import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { RecipeCategory } from "./recipe-category.entity";
import { Recipe } from "./recipe.entity";

@Entity()
@Unique(['name', 'parentCategory'])
export class RecipeSubCategory{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @ManyToOne(() => RecipeCategory, { nullable: true, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    parentCategory: RecipeCategory;

    @OneToMany(() => Recipe, (recipe) => recipe.subCategory)
    recipes: Recipe[];
}