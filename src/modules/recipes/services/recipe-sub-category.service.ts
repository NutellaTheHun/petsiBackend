import { InjectRepository } from "@nestjs/typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Repository } from "typeorm";
import { RecipeIngredientFactory } from "../factories/recipe-ingredient.factory";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { NotImplementedException } from "@nestjs/common";

export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategory>{
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly subCategoryRepo: Repository<RecipeSubCategory>,

        private readonly subCategoryFactory: RecipeIngredientFactory,
    ){ super(subCategoryRepo); }

    async create(createDto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory | null> {
        /*
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const area = this.areaFactory.createEntityInstance({
            name: createDto.name,
            inventoryCounts: await this.countService.findEntitiesById(createDto.inventoryCountIds),
        });

        return await this.subCategoryRepo.save(area);
        */
       throw new NotImplementedException();
    }
    
    /**
    * Uses Repository.Save(), NOT UPDATE
    */
    async update(id: number, updateDto: UpdateRecipeSubCategoryDto): Promise< RecipeSubCategory | null> {
        /*
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.__){
            toUpdate.___ = updateDto.__;
        }

        return await this.subCategoryRepo.save(toUpdate);
        */
       throw new NotImplementedException();
    }

    // findOneBy...
}