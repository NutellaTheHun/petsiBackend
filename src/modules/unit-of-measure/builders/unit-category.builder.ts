import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CreateUnitCategoryDto } from "../dto/create-unit-category.dto";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";
import { UnitCategory } from "../entities/unit-category.entity";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";

@Injectable()
export class UnitCategoryBuilder {
    private category: UnitCategory;

    constructor(
        @Inject(forwardRef(() => UnitOfMeasureService)) 
        private readonly unitService: UnitOfMeasureService,
    ){
        this.reset();
    }

    public reset(): this{
        this.category = new UnitCategory();
        return this;
    }

    public name(name: string): this{
        this.category.name = name;
        return this;
    }

    public async unitsById(ids: number[]): Promise<this>{
        this.category.units = await this.unitService.findEntitiesById(ids);
        return this;
    }

    public async baseUnitById(id: number): Promise<this> {
        const unit = await this.unitService.findOne(id);
        if(!unit){
            throw new Error("unit of measure not found")
        }
        this.category.baseUnit = unit;
        return this;
    }

    public async baseUnitByName(name: string): Promise<this> {
        const unit = await this.unitService.findOneByName(name);
        if(!unit){
            throw new Error("unit of measure not found")
        }
        this.category.baseUnit = unit;
        return this;
    }

    public getCategory(): UnitCategory {
        const result = this.category;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateUnitCategoryDto): Promise<UnitCategory> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            await this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            await this.unitsById(dto.unitOfMeasureIds);
        }

        return this.getCategory();
    }

    public updateCategory(toUpdate: UnitCategory): this {
        this.category = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: UnitCategory, dto: UpdateUnitCategoryDto): Promise<UnitCategory> {
        this.reset();

        this.updateCategory(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            await this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            await this.unitsById(dto.unitOfMeasureIds);
        }

        return this.getCategory();
    }
}