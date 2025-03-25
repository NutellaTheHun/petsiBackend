import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeFactory } from "../factories/recipe.factory";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeCategoryService } from "./recipe-category.service";
import { RecipeSubCategoryService } from "./recipe-sub-category.service";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeIngredientService } from "./recipe-ingredient.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { MenuItemsService } from "../../menu-items/menu-items.service";

export class RecipeService extends ServiceBase<Recipe>{
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,

        private readonly recipeFactory: RecipeFactory,

        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,

        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,

        @Inject(forwardRef(() => RecipeIngredientService))
        private readonly ingredientService: RecipeIngredientService,

        private readonly measureService: UnitOfMeasureService,

        //private readonly menuItemService: MenuItemService,
    ){ super(recipeRepo); }

    async create(createDto: CreateRecipeDto): Promise<Recipe | null> {
            /*
            const exists = await this.findOneByName(createDto.name);
            if(exists) { return null; }
    
            const area = this.areaFactory.createEntityInstance({
                name: createDto.name,
                inventoryCounts: await this.countService.findEntitiesById(createDto.inventoryCountIds),
            });
    
            return await this.recipeRepo.save(area);
            */
            throw new NotImplementedException();
        }
        
        /**
        * Uses Repository.Save(), NOT UPDATE
        */
        async update(id: number, updateDto: UpdateRecipeDto): Promise<Recipe | null> {
            /*
            const toUpdate = await this.findOne(id);
            if(!toUpdate){ return null; }
            
            if(updateDto.__){
                toUpdate.___ = updateDto.__;
            }
    
            return await this.recipeRepo.save(toUpdate);
            */
           throw new NotImplementedException();
        }
    
        // findOneBy...
}