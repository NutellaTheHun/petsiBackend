import { TestingModule } from '@nestjs/testing';
import { UnitOfMeasureController } from './unit-of-measure.controller';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { GALLON, LITER, MILLILITER, FL_OUNCE, QUART } from '../utils/constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';

describe('UnitOfMeasureController', () => {
  let controller: UnitOfMeasureController;
  let unitService: UnitOfMeasureService;

  let units: UnitOfMeasure[];
  let unitId = 1;

 beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();

    controller = module.get<UnitOfMeasureController>(UnitOfMeasureController);
    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);

    units = [
      { name: GALLON } as UnitOfMeasure,
      { name: LITER } as UnitOfMeasure,
      { name: MILLILITER } as UnitOfMeasure,
      { name: FL_OUNCE } as UnitOfMeasure,
      { name: QUART } as UnitOfMeasure,
    ];
    units.map(unit => unit.id = unitId++);

    jest.spyOn(unitService, "create").mockImplementation(async (createDto: CreateUnitOfMeasureDto) => {
      const exists = units.find(unit => unit.name === createDto.name);
      if(exists){ throw new BadRequestException(); }

      const unit = {
        id: unitId++,
        name: createDto.name,
      } as UnitOfMeasure;

      units.push(unit);
      return unit;
    });

    jest.spyOn(unitService, "findOneByName").mockImplementation(async (name: string) => {
      return units.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(unitService, "update").mockImplementation( async (id: number, updateDto: UpdateUnitOfMeasureDto) => {
      const index = units.findIndex(unit => unit.id === id);
      if(index === -1){ throw new NotFoundException(); }


      if(updateDto.name){
        units[index].name = updateDto.name;
      }
      if(updateDto.abbreviation){
        units[index].abbreviation = updateDto.abbreviation;
      }
      if(updateDto.conversionFactorToBase){
        units[index].conversionFactorToBase = updateDto.conversionFactorToBase;
      }

      return units[index];
    });

    jest.spyOn(unitService, "findAll").mockResolvedValue({ items: units });

    jest.spyOn(unitService, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      const result = units.find(unit => unit.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(unitService, "remove").mockImplementation( async (id: number) => {
      const index = units.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      units.splice(index,1);

      return true;
    });
  });


  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a unit', async () => {
    const dto = {
      name: "testUnit",
    } as CreateUnitOfMeasureDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a unit (already exists)', async () => {
    const dto = {
      name: "testUnit",
    } as CreateUnitOfMeasureDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should return all units', async () => {
    const results = await controller.findAll();
    expect(results.items.length).toEqual(units.length);
  });
  
  it('should return a unit by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a unit (bad id, returns null)', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
  });
  
  it('should update a unit', async () => {
    const toUpdate = await unitService.findOneByName("testUnit");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const dto = {
      name: "UPDATED_testUnit"
    } as UpdateUnitOfMeasureDto;

    const result = await controller.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_testUnit")
  });
  
  it('should fail to update a unit (doesnt exist)', async () => {
    const toUpdate = await unitService.findOneByName("UPDATED_testUnit");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const dto = {
      name: "UPDATED_testUnit"
    } as UpdateUnitOfMeasureDto;

    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });
  
  it('should remove a unit', async () => {
    const toRemove = await unitService.findOneByName("UPDATED_testUnit");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeUndefined();
  });

  it('should fail to remove a unit (id not found, returns false)', async () => {
    await expect(controller.remove(0)).rejects.toThrow(NotFoundException);
  });
});
