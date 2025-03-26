import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitCategoryService } from "../services/unit-category.service";
import { CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/update-unit-of-measure.dto";

@Injectable()
export class UnitOfMeasureBuilder {

    private unit: UnitOfMeasure;

    constructor(
        @Inject(forwardRef(() => UnitCategoryService))
        private readonly categoryService: UnitCategoryService,
    ){ 
        this.reset(); 
    }
    
    public reset(): this {
        this.unit = new UnitOfMeasure();
        return this;
    }

    public name(name: string): this {
        this.unit.name = name;
        return this;
    }

    public abbreviation(abr: string): this {
        this.unit.abbreviation = abr;
        return this;
    }

    public async categoryById(id: number): Promise<this> {
        const category = await this.categoryService.findOne(id);
            if(!category){
                throw new Error("category not found");
            }
            this.unit.category = category;
            return this;
    }

    public async categoryByName(name: string): Promise<this> {
        const category = await this.categoryService.findOneByName(name);
        if(!category){
            throw new Error("category not found");
        }
        this.unit.category = category;
        return this;
    }

    public conversionFactor(value: string): this{
        this.unit.conversionFactorToBase = value;
        return this;
    }

    public getUnit(): UnitOfMeasure {
        const result = this.unit;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
        this.reset();
        
        this.name(dto.name);

        this.abbreviation(dto.abbreviation);

        if(dto.conversionFactorToBase){
        this.conversionFactor(dto.conversionFactorToBase);
        }

        if(dto.categoryId){
            await this.categoryById(dto.categoryId);
        }

        return this.getUnit();
    }

    public updateUnit(toUpdate: UnitOfMeasure): this {
        this.unit = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: UnitOfMeasure, dto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
        this.reset();

        this.updateUnit(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        
        if(dto.abbreviation){
            this.abbreviation(dto.abbreviation);
        }
        
        if(dto.conversionFactorToBase){
        this.conversionFactor(dto.conversionFactorToBase);
        }

        // 0 is passed intentionally to remove a category to a unit,
        // so null cannot be used to evaluate in the IF statement.
        if(dto.categoryId !== undefined){
            if(dto.categoryId === 0){
                this.unit.category = null;
              } else {
                await this.categoryById(dto.categoryId);
            }
        }

        return this.getUnit();
    }
}