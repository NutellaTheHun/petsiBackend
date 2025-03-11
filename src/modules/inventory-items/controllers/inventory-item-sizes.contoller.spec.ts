import { TestingModule } from "@nestjs/testing";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { InventoryItemSizeFactory } from "../factories/inventory-item-size.factory";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { getInventoryItemTestingModule } from "../utils/inventory-item-testing-module";
import { InventoryItemSizeController } from "./inventory-item-sizes.contoller";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { UnitOfMeasureFactory } from "../../unit-of-measure/factories/unit-of-measure.factory";
import { InventoryItemFactory } from "../factories/inventory-item.factory";
import { FL_OUNCE, GALLON, LITER, MILLILITER, QUART } from "../../unit-of-measure/utils/constants";
import { InventoryItemPackageFactory } from "../factories/inventory-item-package.factory";

describe('Inventory Item Size Controller', () => {
  let controller: InventoryItemSizeController;
  let service: InventoryItemSizeService;
  let sizeFactory: InventoryItemSizeFactory;

  let itemFactory: InventoryItemFactory;
  let packageFactory: InventoryItemPackageFactory
  let unitFactory: UnitOfMeasureFactory;
  

  beforeEach(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();

    controller = module.get<InventoryItemSizeController>(InventoryItemSizeController);
    service = module.get<InventoryItemSizeService>(InventoryItemSizeService);
    sizeFactory = module.get<InventoryItemSizeFactory>(InventoryItemSizeFactory);

    itemFactory = module.get<InventoryItemFactory>(InventoryItemFactory);
    packageFactory = module.get<InventoryItemPackageFactory>(InventoryItemPackageFactory);
    unitFactory = module.get<UnitOfMeasureFactory>(UnitOfMeasureFactory);

    let units = [
      unitFactory.createEntityInstance({
          name: GALLON, 
      }),
      unitFactory.createEntityInstance({
          name: LITER, 
      }),
      unitFactory.createEntityInstance({
          name: MILLILITER, 
      }),
      unitFactory.createEntityInstance({
          name: FL_OUNCE, 
      }),
      unitFactory.createEntityInstance({
          name: QUART, 
      })
    ];

    let packages = packageFactory.getTestingPackages();

    let items = [
      itemFactory.createEntityInstance({ name: "FOOD_A", category: "foodCat", vendor: "vendorA" }),
      itemFactory.createEntityInstance({ name: "DRY_A", category: "dryGoodsCat", vendor: "vendorA" }),
      itemFactory.createEntityInstance({ name: "OTHER_A", category: "otherCat", vendor: "vendorA" }),
      itemFactory.createEntityInstance({ name: "FOOD_B", category: "foodCat", vendor: "vendorB" }),
      itemFactory.createEntityInstance({ name: "DRY_B", category: "dryGoodsCat", vendor: "vendorB" }),
    ];

    let sizes = [
      sizeFactory.createEntityInstance({
          measureUnit: units[0],
          packageType: packages[0],
          item:items[0],
        }),
        
        sizeFactory.createEntityInstance({
          measureUnit: units[1],
          packageType: packages[1],
          item: items[1],
        }),

        sizeFactory.createEntityInstance({
          measureUnit: units[2],
          packageType: packages[2],
          item: items[2],
        }),

        sizeFactory.createEntityInstance({
          measureUnit: units[3],
          packageType: packages[3],
          item: items[3],
        }),

        sizeFactory.createEntityInstance({
          measureUnit: units[4],
          packageType: packages[4],
          item: items[4],
        })
    ];

    let id = 1;
    sizes.map(size => size.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (createDto: CreateInventoryItemSizeDto) => {
      //const exists = sizes.find(unit => unit.id === createDto.);
      //if(exists){ return null; }

      const unit = sizeFactory.createDtoToEntity(createDto);
      unit.id = id++;
      sizes.push(unit);
      return unit;
    });

    jest.spyOn(service, "findSizesByItemName").mockImplementation(async (name: string, relations?: string[]) => {
      return sizes.filter(unit => unit.item.name == name);
    });
    
    jest.spyOn(service, "update").mockImplementation( async (id: number, updateDto: UpdateInventoryItemSizeDto) => {
      const index = sizes.findIndex(unit => unit.id === id);
      if (index === -1) return null;

      const updated = sizeFactory.updateDtoToEntity(updateDto);
      updated.id = id++;
      sizes[index] = updated;

      return updated;
    });

    jest.spyOn(service, "findAll").mockResolvedValue(sizes);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      return sizes.find(unit => unit.id === id) || null;
    });

    jest.spyOn(service, "remove").mockImplementation( async (id: number) => {
      const index = sizes.findIndex(unit => unit.id === id);
      if (index === -1) return false;

      sizes.splice(index,1);

      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});