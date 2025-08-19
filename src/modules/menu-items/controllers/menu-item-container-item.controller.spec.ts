import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { getTestItemNames } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemContainerItemController } from './menu-item-container-item.controller';

describe('menu item container item controller', () => {
  let controller: MenuItemContainerItemController;
  let service: MenuItemContainerItemService;

  let components: MenuItemContainerItem[] = [];
  let componentId: number = 7;

  let items: MenuItem[] = [];
  let itemId: number = 1;

  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();

    controller = module.get<MenuItemContainerItemController>(
      MenuItemContainerItemController,
    );
    service = module.get<MenuItemContainerItemService>(
      MenuItemContainerItemService,
    );

    const itemNames = getTestItemNames();
    items = itemNames.map(
      (name) =>
        ({
          id: itemId++,
          itemName: name,
        }) as MenuItem,
    );

    components = [
      {
        id: 1,
        parentContainer: items[0],
        containedItem: items[6],
        quantity: 1,
      } as MenuItemContainerItem,
      {
        id: 2,
        parentContainer: items[0],
        containedItem: items[5],
        quantity: 1,
      } as MenuItemContainerItem,

      {
        id: 3,
        parentContainer: items[1],
        containedItem: items[4],
        quantity: 1,
      } as MenuItemContainerItem,
      {
        id: 4,
        parentContainer: items[1],
        containedItem: items[3],
        quantity: 1,
      } as MenuItemContainerItem,

      {
        id: 5,
        parentContainer: items[2],
        containedItem: items[6],
        quantity: 1,
      } as MenuItemContainerItem,
      {
        id: 6,
        parentContainer: items[2],
        containedItem: items[4],
        quantity: 1,
      } as MenuItemContainerItem,
    ];

    jest
      .spyOn(service, 'create')
      .mockImplementation(async (dto: CreateMenuItemContainerItemDto) => {
        const container = items.find(
          (item) => item.id === dto.parentContainerId,
        );
        const item = items.find((item) => item.id === dto.containedMenuItemId);

        const comp = {
          id: componentId++,
          parentContainer: container,
          containedItem: item,
        } as MenuItemContainerItem;

        components.push(comp);
        return comp;
      });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: components });

    jest
      .spyOn(service, 'findEntitiesById')
      .mockImplementation(async (ids: number[]) => {
        return components.filter(
          (comp) => ids.findIndex((id) => id === comp.id) !== -1,
        );
      });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      if (!id) {
        throw new BadRequestException();
      }
      const result = components.find((comp) => comp.id === id);
      if (!result) {
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = components.findIndex((comp) => comp.id === id);
      if (index === -1) {
        return false;
      }

      components.splice(index, 1);
      return true;
    });

    jest
      .spyOn(service, 'update')
      .mockImplementation(
        async (id: number, dto: UpdateMenuItemContainerItemDto) => {
          const existIdx = components.findIndex((comp) => comp.id === id);
          if (existIdx === -1) {
            throw new NotFoundException();
          }

          if (dto.containedMenuItemId) {
            const item = items.find(
              (item) => item.id === dto.containedMenuItemId,
            );
            if (!item) {
              throw new Error();
            }
            components[existIdx].containedItem = item;
          }
          if (dto.quantity) {
            components[existIdx].quantity = dto.quantity;
          }
          return components[existIdx];
        },
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail to create a container item', async () => {
    const dto = {
      parentContainerId: items[1].id,
      containedMenuItemId: items[2].id,
      quantity: 2,
    } as CreateMenuItemContainerItemDto;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should find one component by id', async () => {
    const result = await controller.findOne(1);
    expect(result).not.toBeNull();
  });

  it('should fail to find one component by id (doesnt exist)', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(Error);
  });

  it('should update component', async () => {
    const dto = {
      mode: 'update',
      quantity: 20,
    } as UpdateMenuItemContainerItemDto;

    const result = await controller.update(1, dto);

    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should fail update component (not exist)', async () => {
    const dto = {
      mode: 'update',
      quantity: 20,
    } as UpdateMenuItemContainerItemDto;

    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });

  it('should find all components', async () => {
    const results = await controller.findAll();
    if (!results) {
      throw new Error();
    }
    expect(results.items.length).toBeGreaterThan(0);
  });

  it('should remove component', async () => {
    const removal = await controller.remove(1);
    expect(removal).toBeUndefined();
  });

  it('should fail to remove component (not found)', async () => {
    await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
  });
});
