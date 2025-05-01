import { TestingModule } from "@nestjs/testing";
import { getRecipeTestingModule } from "../../recipes/utils/recipes-testing.module";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemService } from "../services/menu-item.service";
import { getTestItemNames } from "../utils/constants";
import { MenuItemController } from "./menu-item.controller";

describe('menu item controller', () => {
  let controller: MenuItemController;
  let service: MenuItemService;

  let items: MenuItem[];

  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
      
    controller = module.get<MenuItemController>(MenuItemController);
    service = module.get<MenuItemService>(MenuItemService);

    const itemNames = getTestItemNames();
    let id = 1;
    items = itemNames.map( name => ({
      id: id++,
      name: name,
    }) as MenuItem);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemDto) => {
      const exists = items.find(item => item.name === dto.name);
      if(exists){ return null; }

      const item = {
        id: id++,
        name: dto.name,
      } as MenuItem;

      items.push(item);
      return item;
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: items });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return items.filter(item => ids.findIndex(id => id === item.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
      return items.find(item => item.id === id) || null;
    });

    jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
      return items.find(item => item.name === name) || null;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = items.findIndex(item => item.id === id);
      if(index === -1){ return false; }

      items.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemDto) => {
      const existIdx = items.findIndex(item => item.id === id);
      if(existIdx === -1){ return null; }

      if(dto.name){
        items[existIdx].name = dto.name;
      }

      return items[existIdx];
    });  
  });

  it('should be defined', () => {
      expect(service).toBeDefined();
  });

  it('should create a item', async () => {
    const dto = {
      name: "testItem",
    } as CreateMenuItemDto;

    const result = await controller.create(dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull()
    expect(result?.name).toEqual("testItem");

    testId = result?.id as number;
  });

  it('should fail to create a item (already exists)', async () => {
    const dto = {
      name: "testItem",
    } as CreateMenuItemDto;
    
    const result = await controller.create(dto);

    expect(result).toBeNull();
  });

  it('should find item by id', async () => {
    const result = await controller.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should fail find item by id (not exist)', async () => {
    const result = await controller.findOne(0);
    expect(result).toBeNull();
  });

  it('should update item name', async () => {
    const dto = {
      name: "updateTestItem",
    } as UpdateMenuItemDto;

    const result = await controller.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("updateTestItem");
  });

  it('should fail update item name (not exist)', async () => {
    const dto = {
      name: "updateTestItem",
    } as UpdateMenuItemDto;

    const result = await controller.update(0, dto);

    expect(result).toBeNull();
  });

  it('should remove item', async () => {
    const result = await controller.remove(testId);
    expect(result).toBeTruthy();
  });

  it('should fail remove item (not exist)', async () => {
    const result = await controller.remove(testId);
    expect(result).toBeFalsy();
  });
});