import { TestingModule } from '@nestjs/testing';
import { UnitOfMeasureController } from './unit-of-measure.controller';
import { getUnitOfMeasureTestingModule } from '../utils/unit-of-measure-testing-module';
import { UnitOfMeasureFactory } from '../factories/unit-of-measure.factory';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import { CreateUnitOfMeasureDto } from '../dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/update-unit-of-measure.dto';

describe('UnitOfMeasureController', () => {
  let controller: UnitOfMeasureController;
  let unitService: UnitOfMeasureService;
  let unitFactory: UnitOfMeasureFactory;

  let units: UnitOfMeasure[];

 beforeAll(async () => {
    const module: TestingModule = await getUnitOfMeasureTestingModule();

    controller = module.get<UnitOfMeasureController>(UnitOfMeasureController);
    unitFactory = module.get<UnitOfMeasureFactory>(UnitOfMeasureFactory);
    unitService = module.get<UnitOfMeasureService>(UnitOfMeasureService);

    units = await unitFactory.getTestingUnits();
    let id = 1;
    units.map(unit => unit.id = id++);

    jest.spyOn(unitService, "create").mockImplementation(async (createDto: CreateUnitOfMeasureDto) => {
      const exists = units.find(unit => unit.name === createDto.name);
      if(exists){ return null; }

      const unit = unitFactory.createDtoToEntity(createDto);
      unit.id = id++;
      units.push(unit);
      return unit;
    });

    jest.spyOn(unitService, "findOneByName").mockImplementation(async (name: string) => {
      return units.find(unit => unit.name === name) || null;
    });
    
    jest.spyOn(unitService, "update").mockImplementation( async (id: number, updateDto: UpdateUnitOfMeasureDto) => {
      const index = units.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const updated = unitFactory.updateDtoToEntity(updateDto);
      updated.id = id++;
      units[index] = updated;

      return updated;
    });

    jest.spyOn(unitService, "findAll").mockResolvedValue(units);

    jest.spyOn(unitService, "findOne").mockImplementation(async (id: number) => {
      return units.find(unit => unit.id === id) || null;
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
    const unitDto = unitFactory.createDtoInstance({
      name: "testUnit",
    })
    const result = await controller.create(unitDto);
    expect(result).not.toBeNull();
  });
  
  it('should fail to create a unit (already exists)', async () => {
    const unitDto = unitFactory.createDtoInstance({
      name: "testUnit",
    })
    const result = await controller.create(unitDto);
    expect(result).toBeNull();
  });

  it('should return all units', async () => {
    const results = await controller.findAll();
    expect(results.length).toEqual(units.length);
  });
  
  it('should return a unit by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });
  
  it('should fail to return a unit (bad id, returns null)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });
  
  it('should update a unit', async () => {
    const toUpdate = await unitService.findOneByName("testUnit");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    toUpdate.name = "UPDATED_testUnit";
    const result = await controller.update(toUpdate.id, toUpdate);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("UPDATED_testUnit")
  });
  
  it('should fail to update a unit (doesnt exist)', async () => {
    const toUpdate = await unitService.findOneByName("UPDATED_testUnit");
    if(!toUpdate){ throw new Error("unit to update not found"); }

    const result = await controller.update(0, toUpdate);
    expect(result).toBeNull();
  });
  
  it('should remove a unit', async () => {
    const toRemove = await unitService.findOneByName("UPDATED_testUnit");
    if(!toRemove){ throw new Error("unit to remove not found"); }

    const result = await controller.remove(toRemove.id);
    expect(result).toBeTruthy();
  });

  it('should fail to remove a unit (id not found, returns false)', async () => {
    const result = await controller.remove(0);
    expect(result).toBeFalsy();
  });
});
