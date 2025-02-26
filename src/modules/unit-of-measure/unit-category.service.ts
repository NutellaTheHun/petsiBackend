import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryBuilder, Repository } from 'typeorm';
import { UnitCategory } from './entities/unit-category.entity';
import { UnitCategoryFactory } from './factories/unit-category.factory';
import { CreateUnitCategoryDto } from './dto/create-unit-category.dto';
import { UpdateUnitCategoryDto } from './dto/update-unit-category.dto';
import { UnitOfMeasureService } from './unit-of-measure.service';

@Injectable()
export class UnitCategoryService {
    constructor(
        @InjectRepository(UnitCategory)
        private readonly categoryRepo: Repository<UnitCategory>,
    
        private readonly categoryFactory: UnitCategoryFactory,
    
        private readonly unitService: UnitOfMeasureService,
    ){}
    
    async create(createDto: CreateUnitCategoryDto): Promise<UnitCategory | null> {
      const exists = await this.categoryRepo.findOne({ where: { name: createDto.name }});
      if(exists){ return null; } 

      const unitOfMeasureIds = createDto.unitOfMeasureIds || [];
      const category = this.categoryFactory.createEntityInstance(
        createDto, 
        { units: this.unitService.findUnitOfMeasuresById(unitOfMeasureIds) }
      );

      return await this.categoryRepo.save(category);
    }
  
    async findAll(relations?: string[]): Promise<UnitCategory[]> {
      return this.categoryRepo.find({ relations: relations });
    }
  
    async findOne(id: number, relations?: string[]): Promise<UnitCategory | null> {
      return this.categoryRepo.findOne({ where: { id }, relations: relations });
    }
  
    async findOneByName(categoryName: string, relations?: string[]): Promise<UnitCategory | null> {
      return this.categoryRepo.findOne({ where: { name: categoryName }, relations: relations });
    }
  
    async findUnitCategorysById( categoryIds: number[], relations?: string[]): Promise<UnitCategory[]> {
      return this.categoryRepo.find({ where: { id: In(categoryIds) }, relations: relations });
    }
  
    /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param updateDto 
   * @returns 
   */
    async update(id: number, updateDto: UpdateUnitCategoryDto): Promise<UnitCategory | null> {
      const exists = await this.categoryRepo.findOne({ where: { id } });
      if(!exists) { return null; }

      const unitIds = updateDto.unitOfMeasureIds || [];
      const category = this.categoryFactory.updateEntityInstance(
        updateDto, 
        { units: this.unitService.findUnitOfMeasuresById(unitIds)}
      );

      return this.categoryRepo.save(category);
    }
  
    async remove(id: number): Promise<Boolean> {
      return (await this.categoryRepo.delete(id)).affected !== 0;
    }
  
    createUnitCategoryQueryBuilder(): QueryBuilder<UnitCategory> {
      return this.categoryRepo.createQueryBuilder();
    }
}
