import { TestingModule } from "@nestjs/testing";
import { AppHttpException } from "../../../util/exceptions/AppHttpException";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";
import { OrderCategory } from "../entities/order-category.entity";
import { OrderCategoryService } from "../services/order-category.service";
import { getTestOrderTypeNames } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderCategoryController } from "./order-category.controller";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe('order category controller', () => {
    let controller: OrderCategoryController;
    let service: OrderCategoryService;
    let types: OrderCategory[];

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        
        controller = module.get<OrderCategoryController>(OrderCategoryController);
        service = module.get<OrderCategoryService>(OrderCategoryService);

        const typeNames = getTestOrderTypeNames()
        let id = 1;
        types = typeNames.map(name => ({
            id: id++,
            name: name,
        }) as OrderCategory);

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateOrderCategoryDto) => {
            const exists = types.find(category => category.name === dto.name);
            if(exists){ throw new BadRequestException(); }

            const category = {
                id: id++,
                name: dto.name,
            } as OrderCategory;
        
            types.push(category);
            return category;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: types });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return types.filter(type => ids.findIndex(id => id === type.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            const result = types.find(type => type.id === id);
            if(!result){
                throw new NotFoundException();
            }
            return result;
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

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateOrderCategoryDto) => {
            const existIdx = types.findIndex(type => type.id === id);
            if(existIdx === -1){ throw new NotFoundException(); }

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
        } as CreateOrderCategoryDto;
    
        const result = await controller.create(dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.name).toEqual("testType");
    
        testId = result?.id as number;
    });
    
    it('should fail to create a order type (already exists)', async () => {
        const dto = {
        name: "testType",
        } as CreateOrderCategoryDto;
        
        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
    
    it('should find order type by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });
    
    it('should fail find order type by id (not exist)', async () => {
        expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });
    
    it('should update order type name', async () => {
        const dto = {
        name: "updateTestType",
        } as UpdateOrderCategoryDto;
    
        const result = await controller.update(testId, dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.name).toEqual("updateTestType");
    });
    
    it('should fail update order type name (not exist)', async () => {
        const dto = {
        name: "updateTestType",
        } as UpdateOrderCategoryDto;
    
        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
    });
    
    it('should remove order type', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeUndefined();
    });
    
    it('should fail remove order type (not exist)', async () => {
        await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
    });
});