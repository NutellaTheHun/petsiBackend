import { TestingModule } from "@nestjs/testing";
import { getRecipeTestingModule } from "../../recipes/utils/recipes-testing.module";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderMenuItemController } from "./order-menu-item.controller";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { Order } from "../entities/order.entity";
import { OrderType } from "../entities/order-type.entity";
import { getTestOrderTypeNames } from "../utils/constants";
import { getTestItemNames } from "../../menu-items/utils/constants";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { BadRequestException } from "@nestjs/common";

describe('order menu item controller', () => {
    let controller: OrderMenuItemController;
    let service: OrderMenuItemService;

    let orderItems: OrderMenuItem[] = [];
    let orders: Order[] = [];
    let types: OrderType[];

    let items: MenuItem[];

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        
        controller = module.get<OrderMenuItemController>(OrderMenuItemController);
        service = module.get<OrderMenuItemService>(OrderMenuItemService);

        const typeNames = getTestOrderTypeNames()
        let typeId = 1;
        types = typeNames.map(name => ({
            id: typeId++,
            name: name,
        }) as OrderType);

        let orderId = 1;
        for(let i = 0; i < 3; i++){
            orders.push({
                id: orderId++,
                type: types[i],
                fulfillmentDate: new Date(),
            } as Order);
        }

        const itemNames = getTestItemNames();
        let menuItemId = 1;
        items = itemNames.map( name => ({
            id: menuItemId++,
            name: name,
        }) as MenuItem);

        let itemId = 1;
        let mItemIdx = 0;
        for(const order of orders){
            for(let i = 0; i < 2; i++){
                orderItems.push({
                    id: itemId++,
                    order,
                    menuItem: items[mItemIdx++ % items.length],
                    quantity: 1,
                } as OrderMenuItem);
            }
        }

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateOrderMenuItemDto) => {
            const order = orders.find(o => o.id === dto.orderId);
            if(!order){ throw new Error(); }
            const menuItem = items.find(i => i.id === dto.menuItemId);
            if(!menuItem){ throw new Error(); }

            const item = { 
                order,
                menuItem,
                quantity: 1,
            } as OrderMenuItem;

            orderItems.push(item);
            return item;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: orderItems });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return orderItems.filter(item => ids.findIndex(id => id === item.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            //if(!id){ throw new Error(); }
            return orderItems.find(item => item.id === id) || null;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = orderItems.findIndex(item => item.id === id);
            if(index === -1){ return false; }

            orderItems.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateOrderMenuItemDto) => {
            const existIdx = orderItems.findIndex(item => item.id === id);
            if(existIdx === -1){ return null; }

            if(dto.menuItemId){
                const menuItem = items.find(i => i.id === dto.menuItemId);
                if(!menuItem){ throw new Error(); }
                orderItems[existIdx].menuItem = menuItem;
            }
            if(dto.quantity){
                orderItems[existIdx].quantity = dto.quantity;
            }

            return orderItems[existIdx];
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a order menu item', async () => {
        const dto = {
        orderId: orders[0].id,
        menuItemId: items[0].id,
        quantity: 1,
        } as CreateOrderMenuItemDto;
    
        const result = await controller.create(dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.quantity).toEqual(1);
    
        testId = result?.id as number;
    });
    
    it('should find order menu item by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });
    
    it('should fail find order menu item by id (not exist)', async () => {
        const result = await controller.findOne(0);
        expect(result).toBeNull();
        //await expect(controller.findOne(0)).rejects.toThrow(Error);
    });
    
    it('should update order menu item quantity', async () => {
        const dto = {
        quantity: 2,
        } as UpdateOrderMenuItemDto;
    
        const result = await controller.update(testId, dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.quantity).toEqual(2);
    });
    
    it('should fail update order menu item quantity (not exist)', async () => {
        const dto = {
        quantity: 2,
        } as UpdateOrderMenuItemDto;
    
        const result = await controller.update(0, dto);
    
        expect(result).toBeNull();
    });
    
    it('should remove order menu item', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeTruthy();
    });
    
    it('should fail remove order menu item (not exist)', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeFalsy();
    });
});