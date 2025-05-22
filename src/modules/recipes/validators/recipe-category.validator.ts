import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { CreateRecipeCategoryDto } from "../dto/recipe-category/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/recipe-category/update-recipe-category.dto";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";

@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategory> {
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly repo: Repository<RecipeCategory>,

        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeCategoryDto): Promise<string | null> {
        // Check for categories with duplicate names
        const exists = await this.repo.findOne({ where: { categoryName: dto.categoryName }});
        if(exists) { 
            return `Recipe category with name ${dto.categoryName} already exists`; 
        }

        // Check for subcategories with duplicate names
        if(dto.subCategoryDtos){
            const duplicateSubCats = this.helper.hasDuplicatesByComposite(
                dto.subCategoryDtos,
                (item) => `${item.subCategoryName}`
            );
            if(duplicateSubCats){
                return 'category has duplicate subcategories (same name)';
            }
        }
        
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeCategoryDto): Promise<string | null> {
        // Check for categories with duplicate names
        if(dto.categoryName){
            const exists = await this.repo.findOne({ where: { categoryName: dto.categoryName }});
            if(exists) { 
                return `Recipe category with name ${dto.categoryName} already exists`; 
            }
        }

        if(dto.subCategoryDtos){
            const resolvedDtos: {subCategoryName: string}[] = [];
            for(const d of dto.subCategoryDtos){
                if(d.mode === 'create'){
                    resolvedDtos.push({subCategoryName: d.subCategoryName});
                }
                else if(d.mode === 'update'){
                    let subCatName = d.subCategoryName;
                    if(!subCatName){
                        subCatName = (await this.subCategoryService.findOne(d.id)).subCategoryName
                    }
                    resolvedDtos.push({subCategoryName: subCatName});
                }
            }

            const duplicateSubCats = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (item) => `${item.subCategoryName}`
            );
            if(duplicateSubCats){
                return 'category has duplicate subcategories (same name)';
            }
        }
        return null;
    }
}