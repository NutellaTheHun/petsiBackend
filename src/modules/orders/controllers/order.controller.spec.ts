import { TestingModule } from "@nestjs/testing";
import { AppHttpException } from "../../../util/exceptions/AppHttpException";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { OrderType } from "../entities/order-type.entity";
import { Order } from "../entities/order.entity";
import { OrderService } from "../services/order.service";
import { getTestOrderTypeNames } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderController } from "./order.controller";

describe('order controller', () => {
    let controller: OrderController;
    let service: OrderService;

    let orders: Order[] = [];
    let types: OrderType[];

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        
        controller = module.get<OrderController>(OrderController);
        service = module.get<OrderService>(OrderService);

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

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateOrderDto) => {
            const oType = types.find(t => t.id === dto.orderTypeId);
            const order = {
                id: orderId++,
                type: oType,
                fulfillmentDate: dto.fulfillmentDate,
            } as Order;
        
            orders.push(order);
            return order;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: orders });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return orders.filter(order => ids.findIndex(id => id === order.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            return orders.find(order => order.id === id) || null;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = orders.findIndex(order => order.id === id);
            if(index === -1){ return false; }

            orders.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateOrderDto) => {
            const existIdx = orders.findIndex(order => order.id === id);
            if(existIdx === -1){ return null; }

            if(dto.orderTypeId){
                const oType = types.find(t => t.id === dto.orderTypeId);
                if(!oType){ throw new Error(); }
                orders[existIdx].type = oType;
            }
            if(dto.deliveryAddress){
                orders[existIdx].deliveryAddress = dto.deliveryAddress;
            }

            return orders[existIdx];
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a order', async () => {
        const dto = {
            orderTypeId: types[0].id,
            fulfillmentDate: new Date(),
        } as CreateOrderDto;
    
        const result = await controller.create(dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
    
        testId = result?.id as number;
    });
    
    it('should find order by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });
    
    it('should fail find order by id (not exist)', async () => {
        const result = await controller.findOne(0);
        expect(result).toBeNull();
    });
    
    it('should update order quantity', async () => {
        const dto = {
            deliveryAddress: "test",
        } as UpdateOrderDto;
    
        const result = await controller.update(testId, dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.deliveryAddress).toEqual("test");
    });
    
    it('should fail update order quantity (not exist)', async () => {
        const dto = {
            deliveryAddress: "test",
        } as UpdateOrderDto;
    
        await expect(controller.update(0, dto)).rejects.toThrow(AppHttpException);
    });
    
    it('should remove order', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeTruthy();
    });
    
    it('should fail remove order (not exist)', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeFalsy();
    });
});