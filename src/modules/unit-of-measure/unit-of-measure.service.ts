import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { In, QueryBuilder, Repository } from 'typeorm';
import { UnitCategoryService } from './unit-category.service';
import { UnitOfMeasureFactory } from './factories/unit-of-measure.factory';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';

@Injectable()
export class UnitOfMeasureService {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly unitRepo: Repository<UnitOfMeasure>,
    
        private readonly unitFactory: UnitOfMeasureFactory,
    
        private readonly categoryService: UnitCategoryService,
      ){}
    
      async create(createDto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
        const alreadyExists = await this.unitRepo.findOne({ where: { name: createDto.name }});
        if(alreadyExists){ return null; }
    
        const categoryId = createDto.categoryId;
        const unit = await this.unitFactory.createEntityInstance(
          createDto, 
          { category: await this.categoryService.findOne(categoryId) }
        );
    
        return await this.unitRepo.save(unit);
      }
    
      async findAll(relations?: string[]): Promise<UnitOfMeasure[]> {
        return await this.unitRepo.find({relations: relations});
      }
    
      async findOne(id: number, relations?: string[]): Promise<UnitOfMeasure | null> {
        return await this.unitRepo.findOne({ where: { id }, relations: relations });
      }
    
      async findOneByName(unitName: string, relations?: string[]): Promise<UnitOfMeasure | null> {
        return await this.unitRepo.findOne({ where: { name: unitName }, relations: relations  });
      }
    
      async findUnitOfMeasuresById( unitIds: number[], relations?: string[]): Promise<UnitOfMeasure[]> {
        return await this.unitRepo.find({ where: { id: In(unitIds) }, relations: relations });
      }
    
      /**
       * Id currently not used, using Repository.save for lifecycle hooks
       * @param id currently not used, using Repository.save for lifecycle hooks
       * @param UnitOfMeasureDto 
       * @returns 
       */
      async update(id: number, updateDto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
        const alreadyExists = await this.unitRepo.findOne({ where: { id }});
        if(!alreadyExists){ return null; } //more detailed error
    
        const category = updateDto.categoryId
          ? await this.categoryService.findOne(updateDto.categoryId)
          : null;

        const unit = await this.unitFactory.updateEntityInstance(
          updateDto, 
          { category: category }
        );
        
        return this.unitRepo.save(unit);
      }
    
      async remove(id: number): Promise<Boolean> {
        return (await this.unitRepo.delete(id)).affected !== 0;
      }
    
      createUnitOfMeasureQueryBuilder(): QueryBuilder<UnitOfMeasure> {
        return this.unitRepo.createQueryBuilder();
      }
}
