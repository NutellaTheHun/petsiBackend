import { TestingModule } from "@nestjs/testing";
import { getRecipeTestingModule } from "../../recipes/utils/recipes-testing.module";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemSizeController } from "./menu-item-size.controller";
import { MenuItemService } from "../services/menu-item.service";
import { getTestSizeNames } from "../utils/constants";
import { CreateMenuItemSizeDto } from "../dto/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/update-menu-item-size.dto";
import { NotImplementedException } from "@nestjs/common";

describe('menu item size controller', () => {
  let controller: MenuItemSizeController;
  let service: MenuItemSizeService;
  let sizes: MenuItemSize[];

  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<MenuItemSizeController>(MenuItemSizeController);
    service = module.get<MenuItemSizeService>(MenuItemSizeService);

    const names = getTestSizeNames();
    let id = 1;
    sizes = names.map( name => ({
      id: id++,
      name: name,
    }) as MenuItemSize);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemSizeDto) => {
        const exists = sizes.find(size => size.name === dto.name);
        if(exists){ return null; }

        const size = {
          id: id++,
          name: dto.name,
        } as MenuItemSize;
  
        sizes.push(size);
        return size;
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: sizes });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return sizes.filter(size => ids.findIndex(id => id === size.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
      return sizes.find(size => size.id === id) || null;
    });

    jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
      return sizes.find(size => size.name === name) || null;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = sizes.findIndex(size => size.id === id);
      if(index === -1){ return false; }

      sizes.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemSizeDto) => {
      const existIdx = sizes.findIndex(size => size.id === id);
      if(existIdx === -1){ return null; }

      if(dto.name){
        sizes[existIdx].name = dto.name;
      }

      return sizes[existIdx];
    });    
  });

  it('should be defined', () => {
      expect(service).toBeDefined();
  });

  it('should create a size', async () => {
     const dto = {
       name: "testItemSize",
     } as CreateMenuItemSizeDto;
 
     const result = await controller.create(dto);
 
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull()
     expect(result?.name).toEqual("testItemSize");
 
     testId = result?.id as number;
   });
 
   it('should fail to create a size (already exists)', async () => {
     const dto = {
       name: "testItemSize",
     } as CreateMenuItemSizeDto;
     
     const result = await controller.create(dto);
 
     expect(result).toBeNull();
   });
 
   it('should find size by id', async () => {
     const result = await controller.findOne(testId);
     expect(result).not.toBeNull();
   });
 
   it('should fail find size by id (not exist)', async () => {
     const result = await controller.findOne(0);
     expect(result).toBeNull();
   });
 
   it('should update size name', async () => {
     const dto = {
       name: "updateTestItemSize",
     } as UpdateMenuItemSizeDto;
 
     const result = await controller.update(testId, dto);
 
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull()
     expect(result?.name).toEqual("updateTestItemSize");
   });
 
   it('should fail update size name (not exist)', async () => {
     const dto = {
       name: "updateTestItemSize",
     } as UpdateMenuItemSizeDto;
 
     const result = await controller.update(0, dto);
 
     expect(result).toBeNull();
   });
 
   it('should remove size', async () => {
     const result = await controller.remove(testId);
     expect(result).toBeTruthy();
   });
 
   it('should fail remove size (not exist)', async () => {
     const result = await controller.remove(testId);
     expect(result).toBeFalsy();
   });
});