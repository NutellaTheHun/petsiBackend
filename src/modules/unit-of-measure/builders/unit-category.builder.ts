import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateUnitCategoryDto } from "../dto/create-unit-category.dto";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";
import { UnitCategory } from "../entities/unit-category.entity";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import { UnitCategoryValidator } from "../validators/unit-category.validator";

@Injectable()
export class UnitCategoryBuilder extends BuilderBase<UnitCategory>{
    constructor(
        @Inject(forwardRef(() => UnitOfMeasureService)) 
        private readonly unitService: UnitOfMeasureService,
        validator: UnitCategoryValidator,
    ){ super(UnitCategory, validator); }

    protected async createEntity(dto: CreateUnitCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            this.unitsById(dto.unitOfMeasureIds);
        }
    }

    protected async updateEntity(dto: UpdateUnitCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            this.unitsById(dto.unitOfMeasureIds);
        }
    }

    public name(name: string): this{
        return this.setProp('name', name);
    }

    public unitsById(ids: number[]): this{
        return this.setPropsByIds(this.unitService.findEntitiesById.bind(this.unitService), 'units', ids);
    }

    public baseUnitById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'baseUnit', id);
    }

    public async baseUnitByName(name: string): Promise<this> {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'baseUnit', name);
    }
/*
    public async buildCreateDto(dto: CreateUnitCategoryDto): Promise<UnitCategory> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            this.unitsById(dto.unitOfMeasureIds);
        }

        return await this.build();
    }*/
/*
    public async buildUpdateDto(toUpdate: UnitCategory, dto: UpdateUnitCategoryDto): Promise<UnitCategory> {
        this.reset();
        this.setEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            this.unitsById(dto.unitOfMeasureIds);
        }

        return await this.build();
    }*/
}