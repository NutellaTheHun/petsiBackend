import { TestingModule } from "@nestjs/testing";
import { CreateOrderTypeDto } from "../dto/create-order-type.dto";
import { UpdateOrderTypeDto } from "../dto/update-order-type.dto";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeService } from "../services/order-type.service";
import { getTestOrderTypeNames } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTypeController } from "./order-type.controller";
import { BadRequestException } from "@nestjs/common";

describe('order type controller', () => {
    let controller: OrderTypeController;
    let service: OrderTypeService;
    let types: OrderType[];

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        
        controller = module.get<OrderTypeController>(OrderTypeController);
        service = module.get<OrderTypeService>(OrderTypeService);

        const typeNames = getTestOrderTypeNames()
        let id = 1;
        types = typeNames.map(name => ({
            id: id++,
            name: name,
        }) as OrderType);

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateOrderTypeDto) => {
            const exists = types.find(category => category.name === dto.name);
            if(exists){ return null; }

            const category = {
                id: id++,
                name: dto.name,
            } as OrderType;
        
            types.push(category);
            return category;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: types });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return types.filter(type => ids.findIndex(id => id === type.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
            if(!id){ throw new BadRequestException(); }
            return types.find(type => type.id === id) || null;
        });

        jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
            return types.find(type => type.name === name) || null;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = types.findIndex(type => type.id === id);
            if(index === -1){ return false; }

            types.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateOrderTypeDto) => {
            const existIdx = types.findIndex(type => type.id === id);
            if(existIdx === -1){ return null; }

            if(dto.name){
                types[existIdx].name = dto.name;
            }

            return types[existIdx];
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a order type', async () => {
        const dto = {
        name: "testType",
        } as CreateOrderTypeDto;
    
        const result = await controller.create(dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.name).toEqual("testType");
    
        testId = result?.id as number;
    });
    
    it('should fail to create a order type (already exists)', async () => {
        const dto = {
        name: "testType",
        } as CreateOrderTypeDto;
        
        const result = await controller.create(dto);
    
        expect(result).toBeNull();
    });
    
    it('should find order type by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });
    
    it('should fail find order type by id (not exist)', async () => {
        const result = await controller.findOne(0);
        expect(result).toBeNull();
    });
    
    it('should update order type name', async () => {
        const dto = {
        name: "updateTestType",
        } as UpdateOrderTypeDto;
    
        const result = await controller.update(testId, dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.name).toEqual("updateTestType");
    });
    
    it('should fail update order type name (not exist)', async () => {
        const dto = {
        name: "updateTestType",
        } as UpdateOrderTypeDto;
    
        const result = await controller.update(0, dto);
    
        expect(result).toBeNull();
    });
    
    it('should remove order type', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeTruthy();
    });
    
    it('should fail remove order type (not exist)', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeFalsy();
    });
});