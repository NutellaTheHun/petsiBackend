import { InjectRepository } from "@nestjs/typeorm";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeCategoryFactory } from "../factories/recipe-category.factory";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { NotImplementedException } from "@nestjs/common";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";

export class RecipeCategoryService extends ServiceBase<RecipeCategory>{
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly categoryRepo: Repository<RecipeCategory>,

        private readonly categoryFactory: RecipeCategoryFactory,
    ){ super(categoryRepo); }

    async create(createDto: CreateRecipeCategoryDto): Promise<RecipeCategory | null> {
        /*
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const area = this.areaFactory.createEntityInstance({
            name: createDto.name,
            inventoryCounts: await this.countService.findEntitiesById(createDto.inventoryCountIds),
        });

        return await this.categoryRepo.save(area);
        */
       throw new NotImplementedException();
    }
    
    /**
    * Uses Repository.Save(), NOT UPDATE
    */
    async update(id: number, updateDto: UpdateRecipeCategoryDto): Promise< RecipeCategory | null> {
        /*
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.__){
            toUpdate.___ = updateDto.__;
        }

        return await this.categoryRepo.save(toUpdate);
        */
        throw new NotImplementedException();
    }

    // findOneBy...
}