import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RecipeSubCategory{
    @PrimaryGeneratedColumn()
    id: number;

    
}