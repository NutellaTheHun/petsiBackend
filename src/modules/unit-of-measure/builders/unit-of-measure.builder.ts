import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/update-unit-of-measure.dto";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitCategoryService } from "../services/unit-category.service";
import { UnitOfMeasureValidator } from "../validators/unit-of-measure.validator";

@Injectable()
export class UnitOfMeasureBuilder extends BuilderBase<UnitOfMeasure>{
    constructor(
        @Inject(forwardRef(() => UnitCategoryService))
        private readonly categoryService: UnitCategoryService,
        validator: UnitOfMeasureValidator,
    ){ super(UnitOfMeasure, validator); }
    
    protected async createEntity(dto: CreateUnitOfMeasureDto): Promise<void> {
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
    }

    protected async updateEntity(dto: UpdateUnitOfMeasureDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.abbreviation){
            this.abbreviation(dto.abbreviation);
        }
        if(dto.conversionFactorToBase){
            this.conversionFactor(dto.conversionFactorToBase);
        }
        if(dto.categoryId !== undefined){
            this.categoryById(dto.categoryId);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public abbreviation(abr: string): this {
        return this.setProp('abbreviation', abr);
    }

    public categoryById(id: number): this {
        if(id === 0){
            return this.setProp('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public conversionFactor(value: string): this{
        return this.setProp('conversionFactorToBase', value);
    }

    /**
     * If no category is given, default category is "no category"
     */
    /*
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
    }*/

    /*
    public async buildUpdateDto(toUpdate: UnitOfMeasure, dto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
        this.reset();
        this.setEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.abbreviation){
            this.abbreviation(dto.abbreviation);
        }
        if(dto.conversionFactorToBase){
            this.conversionFactor(dto.conversionFactorToBase);
        }
        if(dto.categoryId !== undefined){
            this.categoryById(dto.categoryId);
        }
        
        return await this.build();
    }*/
}