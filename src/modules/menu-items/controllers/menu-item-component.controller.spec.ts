import { TestingModule } from "@nestjs/testing";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";
import { MenuItemComponentController } from "./menu-item-component.controller";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItem } from "../entities/menu-item.entity";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { NotImplementedException } from "@nestjs/common";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { getTestItemNames } from "../utils/constants";

describe('menu item component controller', () => {
    let controller: MenuItemComponentController;
    let service: MenuItemComponentService;

    let components: MenuItemComponent[] = [];
    let componentId: number = 7;

    let items: MenuItem[] = [];
    let itemId: number = 1;

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();

        controller = module.get<MenuItemComponentController>(MenuItemComponentController);
        service = module.get<MenuItemComponentService>(MenuItemComponentService);

        const itemNames = getTestItemNames();
        items = itemNames.map( name => ({
            id: itemId++,
            name: name,
        }) as MenuItem);

        components = [
            {
                id: 1,
                container: items[0],
                item: items[6],
                quantity: 1,
            } as MenuItemComponent,
            {
                id: 2,
                container: items[0],
                item: items[5],
                quantity: 1,
            } as MenuItemComponent,

            {
                id: 3,
                container: items[1],
                item: items[4],
                quantity: 1,
            } as MenuItemComponent,
            {
                id: 4,
                container: items[1],
                item: items[3],
                quantity: 1,
            } as MenuItemComponent,

            {
                id: 5,
                container: items[2],
                item: items[6],
                quantity: 1,
            } as MenuItemComponent,
            {
                id: 6,
                container: items[2],
                item: items[4],
                quantity: 1,
            } as MenuItemComponent,
        ];

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemComponentDto) => {
            const container = items.find(item => item.id === dto.containerId);
            const item = items.find(item => item.id === dto.menuItemId);

            const comp = {
                id: componentId++,
                container,
                item,
            } as MenuItemComponent;

            components.push(comp);
            return comp;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: components});

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return components.filter(comp => ids.findIndex(id => id === comp.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            return components.find(comp => comp.id === id) || null;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = components.findIndex(comp => comp.id === id);
            if(index === -1){ return false; }

            components.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemComponentDto) => {
            const existIdx = components.findIndex(comp => comp.id === id);
            if(existIdx === -1){ return null; }

            if(dto.menuItemId){
                const item = items.find(item => item.id === dto.menuItemId);
                if(!item){ throw new Error(); }
                components[existIdx].item = item;
            }
            if(dto.quantity){
                components[existIdx].quantity = dto.quantity;
            }
            return components[existIdx];
        });
    });
    
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a component', async () => {
        const dto = {
            containerId: items[1].id,
            menuItemId: items[2].id,
            quantity: 2,
        } as CreateMenuItemComponentDto;

        const result = await controller.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()

        testId = result?.id as number;
    });

    it('should find one component by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should fail to find one component by id (doesnt exist)', async () => {
        const result = await controller.findOne(0);
        expect(result).toBeNull();
    });

    it('should update component', async () => {
        const dto = {
        mode: 'update',
        quantity: 20,
        } as UpdateMenuItemComponentDto;

        const result = await controller.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull();
    });

    it('should fail update component (not exist)', async () => {
        const dto = {
        mode: 'update',
        quantity: 20,
        } as UpdateMenuItemComponentDto;

        const result = await controller.update(0, dto);

        expect(result).toBeNull();
    });

    it('should find all components', async () => {
        const results = await controller.findAll();
        if(!results){throw new Error(); }
        expect(results.items.length).toBeGreaterThan(0);
    });

    it('should remove component', async () => {
        const removal = await controller.remove(testId);
        expect(removal).toBeTruthy();
    });

    it('should fail to remove component (not found)', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeFalsy();
    });
});