import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateUnitOfMeasureCategoryDto } from "../dto/unit-of-measure-category/create-unit-of-measure-category.dto";
import { UpdateUnitOfMeasureCategoryDto } from "../dto/unit-of-measure-category/update-unit-of-measure-category.dto";
import { UnitOfMeasureCategory } from "../entities/unit-of-measure-category.entity";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import { UnitOfMeasureCategoryValidator } from "../validators/unit-of-measure-category.validator";

@Injectable()
export class UnitOfMeasureCategoryBuilder extends BuilderBase<UnitOfMeasureCategory>{
    constructor(
        @Inject(forwardRef(() => UnitOfMeasureService)) 
        private readonly unitService: UnitOfMeasureService,

        validator: UnitOfMeasureCategoryValidator,

        requestContextService: RequestContextService,
        
        logger: AppLogger,
    ){ super(UnitOfMeasureCategory, 'UnitCategoryBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateUnitOfMeasureCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            this.baseUnitById(dto.baseUnitId);
        }
    }

    protected updateEntity(dto: UpdateUnitOfMeasureCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.baseUnitId){
            this.baseUnitById(dto.baseUnitId);
        }
    }

    public name(name: string): this{
        return this.setPropByVal('name', name);
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
}