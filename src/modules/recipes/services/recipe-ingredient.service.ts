import { InjectRepository } from "@nestjs/typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { Repository } from "typeorm";
import { RecipeIngredientFactory } from "../factories/recipe-ingredient.factory";
import { NotImplementedException } from "@nestjs/common";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";

export class RecipeIngredientService extends ServiceBase<RecipeIngredient>{
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly ingredientRepo: Repository<RecipeIngredient>,

        private readonly ingredientFactory: RecipeIngredientFactory,
    ){ super(ingredientRepo); }

    async create(createDto: CreateRecipeIngredientDto): Promise<RecipeIngredient | null> {
        /*
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const area = this.areaFactory.createEntityInstance({
            name: createDto.name,
            inventoryCounts: await this.countService.findEntitiesById(createDto.inventoryCountIds),
        });

        return await this.ingredientRepo.save(area);
        */
       throw new NotImplementedException();
    }
    
    /**
    * Uses Repository.Save(), NOT UPDATE
    */
    async update(id: number, updateDto: UpdateRecipeIngredientDto): Promise< RecipeIngredient | null> {
        /*
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.__){
            toUpdate.___ = updateDto.__;
        }

        return await this.ingredientRepo.save(toUpdate);
        */
       throw new NotImplementedException();
    }

    // findOneBy...
}