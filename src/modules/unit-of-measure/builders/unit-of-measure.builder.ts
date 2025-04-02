import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitCategoryService } from "../services/unit-category.service";
import { CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/update-unit-of-measure.dto";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { UnitCategory } from "../entities/unit-category.entity";

@Injectable()
export class UnitOfMeasureBuilder {
    private unit: UnitOfMeasure;
    private taskQueue: (() => Promise<void>)[];
    private categoryMethods: BuilderMethodBase<UnitCategory>;

    constructor(
        @Inject(forwardRef(() => UnitCategoryService))
        private readonly categoryService: UnitCategoryService,
    ){ 
        this.reset(); 
        this.categoryMethods = new BuilderMethodBase(this.categoryService, this.categoryService.findOneByName.bind(this.categoryService));
    }
    
    public reset(): this {
        this.unit = new UnitOfMeasure();
        this.taskQueue = [];
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

    public categoryById(id: number): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityById(
                (cat) => {this.unit.category = cat; },
                id,
            );
        });
        return this;
    }

    public categoryByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityByName(
                (cat) => {this.unit.category = cat; },
                name,
            );
        });
        return this;
    }

    public conversionFactor(value: string): this{
        this.unit.conversionFactorToBase = value;
        return this;
    }

    public async build(): Promise<UnitOfMeasure> {
        for(const task of this.taskQueue){
            await task();
        }

        const result = this.unit;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.abbreviation){
            this.abbreviation(dto.abbreviation);
        }
        if(dto.conversionFactorToBase){
            this.conversionFactor(dto.conversionFactorToBase);
        }
        if(dto.categoryId){
            this.categoryById(dto.categoryId);
        }

        return await this.build();
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
                this.categoryById(dto.categoryId);
            }
        }
        return await this.build();
    }
}