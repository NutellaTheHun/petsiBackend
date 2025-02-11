import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RecipeCategory {
    @PrimaryGeneratedColumn()
    id: number;

    
}