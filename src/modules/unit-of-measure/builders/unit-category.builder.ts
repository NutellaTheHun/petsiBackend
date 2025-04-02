import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CreateUnitCategoryDto } from "../dto/create-unit-category.dto";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";
import { UnitCategory } from "../entities/unit-category.entity";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";

@Injectable()
export class UnitCategoryBuilder {
    private category: UnitCategory;
    private taskQueue: (() => Promise<void>)[];

    private unitMethods: BuilderMethodBase<UnitOfMeasure>;

    constructor(
        @Inject(forwardRef(() => UnitOfMeasureService)) 
        private readonly unitService: UnitOfMeasureService,
    ){
        this.reset();
        this.unitMethods = new BuilderMethodBase(this.unitService, this.unitService.findOneByName.bind(this.unitService));
    }

    public reset(): this{
        this.category = new UnitCategory();
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this{
        this.category.name = name;
        return this;
    }

    public unitsById(ids: number[]): this{
        this.taskQueue.push(async () => {
            await this.unitMethods.entityByIds(
                (units) => {this.category.units = units; },
                ids,
            )
        });
        return this;
    }

    public baseUnitById(id: number): this {
        this.taskQueue.push(async () => {
            await this.unitMethods.entityById(
                (unit) => {this.category.baseUnit = unit;},
                id,
            )
        });
        return this;
    }

    public async baseUnitByName(name: string): Promise<this> {
        await this.unitMethods.entityByName(
            (unit) => {this.category.baseUnit = unit;},
            name,
        )
        return this;
    }

    public async build(): Promise<UnitCategory> {
        for(const task of this.taskQueue){
            await task();
        }
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
            this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            this.unitsById(dto.unitOfMeasureIds);
        }

        return await this.build();
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
            this.baseUnitById(dto.baseUnitId);
        }
        if(dto.unitOfMeasureIds){
            this.unitsById(dto.unitOfMeasureIds);
        }

        return await this.build();
    }
}