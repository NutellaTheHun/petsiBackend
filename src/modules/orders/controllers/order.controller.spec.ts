import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Between, Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a } from '../../menu-items/utils/constants';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { Order } from '../entities/order.entity';
import { OrderService } from '../services/order.service';
import { TYPE_A } from '../utils/constants';
import { orderToUpdateDto } from '../utils/entity-transformers/order.dto.transformer';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderController } from './order.controller';

const SEARCH_RELATIONS = [
    'orderedItems',
    'orderedItems.menuItem',
    'orderedItems.containerOrderMenuItems',
    'orderedItems.containerOrderMenuItems.containedMenuItem',
    'orderedItems.containerOrderMenuItems.containedItemSize',
] as const;

describe('order controller', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: OrderController;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        module = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        controller = module.get<OrderController>(OrderController);
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    async function loadOrderForUpdate(): Promise<Order> {
        return orderRepo.findOneOrFail({
            where: {},
            relations: [
                'recurrenceSchedule',
                'orderedItems',
                'orderedItems.menuItem',
                'orderedItems.size',
                'category',
                'orderedItems.containerOrderMenuItems',
                'orderedItems.containerOrderMenuItems.containedMenuItem',
                'orderedItems.containerOrderMenuItems.containedItemSize',
            ],
        });
    }

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAllOrderResponses returns items aligned with repository', async () => {
        const repoRows = await orderRepo.find();
        const result = await controller.findAllOrderResponses(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAllOrderResponses with search by recipient', async () => {
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'recipient',
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((o) =>
                o.recipient.toLowerCase().includes('recipient'),
            ),
        ).toBe(true);
    });

    it('findAllOrderResponses with search by menuItem name matches service ids', async () => {
        const orderService = module.get(OrderService);
        const rels = [...SEARCH_RELATIONS];
        const svcResult = await orderService.findAll({
            search: 'item',
            limit: 100,
            relations: rels as string[],
        });
        const ctrlResult = await controller.findAllOrderResponses(
            rels,
            100,
            undefined,
            undefined,
            undefined,
            'item',
            undefined,
        );
        expect(ctrlResult.items.length).toEqual(svcResult?.items.length ?? 0);
        const svcIds = (svcResult?.items ?? []).map((o) => o.id).sort((a, b) => a - b);
        const ctrlIds = ctrlResult.items.map((o) => o.id).sort((a, b) => a - b);
        expect(ctrlIds).toEqual(svcIds);
    });

    it('findAllOrderResponses with filter by category matches repository', async () => {
        const [cat] = await categoryRepo.find({ where: { name: TYPE_A } });
        if (!cat) throw new Error('category not found');
        const repoResult = await orderRepo.find({
            where: { category: { id: cat.id } },
        });
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`category=${cat.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAllOrderResponses with filter isFrozen=false', async () => {
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            ['isFrozen=false'],
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.every((o) => !o.isFrozen)).toBe(true);
    });

    it('findAllOrderResponses with filter fulfillmentType=pickup', async () => {
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            ['fulfillmentType=pickup'],
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((o) => o.fulfillmentType === 'pickup'),
        ).toBe(true);
    });

    it('findAllOrderResponses with date range on fulfillmentDate', async () => {
        const sDate = new Date('2020-01-01');
        const eDate = new Date('2030-12-31');
        const repoResult = await orderRepo.find({
            where: { fulfillmentDate: Between(sDate, eDate) },
        });
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'fulfillmentDate',
            sDate.toISOString(),
            eDate.toISOString(),
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(
            result.items.every(
                (o) => o.fulfillmentDate >= sDate && o.fulfillmentDate <= eDate,
            ),
        ).toBe(true);
    });

    it('findAllOrderResponses with sortBy category DESC aligns with repository', async () => {
        const repoResult = await orderRepo.find({
            relations: ['category'],
            order: { category: { name: 'DESC' } },
        });
        if (!repoResult.length) throw new Error('orders not found');
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            'category',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(result.items[0]?.category?.name).toEqual(
            repoResult[0]?.category?.name,
        );
        expect(
            result.items[result.items.length - 1].recipient,
        ).toEqual(repoResult[repoResult.length - 1].recipient);
    });

    it('findAllOrderResponses with sortBy fulfillmentDate DESC aligns with repository', async () => {
        const repoResult = await orderRepo.find({
            order: { fulfillmentDate: 'DESC' },
        });
        if (!repoResult.length) throw new Error('orders not found');
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            'fulfillmentDate',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(result.items[0]?.fulfillmentDate).toEqual(
            repoResult[0]?.fulfillmentDate,
        );
        expect(
            result.items[result.items.length - 1]?.fulfillmentDate,
        ).toEqual(repoResult[repoResult.length - 1]?.fulfillmentDate);
    });

    it('findAllOrderResponses with sortBy createdAt DESC aligns with repository', async () => {
        const repoResult = await orderRepo.find({
            order: { createdAt: 'DESC' },
        });
        if (!repoResult.length) throw new Error('orders not found');
        const result = await controller.findAllOrderResponses(
            undefined,
            100,
            undefined,
            'createdAt',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        expect(result.items[0]?.createdAt).toEqual(repoResult[0]?.createdAt);
        expect(
            result.items[result.items.length - 1]?.createdAt,
        ).toEqual(repoResult[repoResult.length - 1]?.createdAt);
    });

    it('findOneOrderResponse returns a seeded order', async () => {
        const [o] = await orderRepo.find({ take: 1 });
        if (!o) throw new Error('order not found');
        const result = await controller.findOneOrderResponse(o.id);
        expect(result.id).toEqual(o.id);
    });

    it('findOneOrderResponse throws NotFoundException for missing id', async () => {
        await expect(controller.findOneOrderResponse(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('createOrderResponse persists a new order', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Controller Order Create',
            fulfillmentDate: new Date('2026-02-01'),
            fulfillmentType: 'pickup',
            categoryId: cat.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'o1',
                    menuItemId: mi.id,
                    sizeId: mi.sizes[0].id,
                    quantity: 2,
                }),
            ],
        });
        const result = await controller.createOrderResponse(dto);
        expect(result.id).toBeDefined();
        const row = await orderRepo.findOne({
            where: { recipient: 'Controller Order Create' },
        });
        expect(row).not.toBeNull();
    });

    it('createOrderResponse throws ValidationException for invalid fulfillmentType', async () => {
        const category = await categoryRepo.findOneOrFail({
            where: { name: TYPE_A },
        });
        const singleMenuItem = await menuItemRepo.findOneOrFail({
            where: { name: item_a },
            relations: ['sizes'],
        });

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'John Doe',
            fulfillmentDate: new Date(),
            fulfillmentType: 'invalid_type',
            categoryId: category.id,
            orderedItems: [
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'c1',
                    menuItemId: singleMenuItem.id,
                    sizeId: singleMenuItem.sizes[0].id,
                    quantity: 2,
                }),
            ],
        });
        try {
            await controller.createOrderResponse(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
                    'fulfillmentType',
                ]),
            );
        }
    });

    it('updateOrderResponse throws ValidationException for invalid fulfillmentType', async () => {
        const orderToUpdate = await loadOrderForUpdate();
        const dto = orderToUpdateDto(orderToUpdate, {
            fulfillmentType: 'invalid_type',
        });
        try {
            await controller.updateOrderResponse(orderToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
                    'fulfillmentType',
                ]),
            );
        }
    });

    it('updateOrderResponse surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateOrderDto, {
            recipient: 'DoesNotMatter',
        });
        await expect(
            controller.updateOrderResponse(9_999_999, dto),
        ).rejects.toThrow(DatabaseException);
    });

    describe('change detector on update', () => {
        let updateEntitySpy: jest.SpyInstance;

        beforeEach(() => {
            updateEntitySpy = jest.spyOn(
                OrderService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            updateEntitySpy.mockRestore();
        });

        it('skips updateEntity when DTO matches current order', async () => {
            const order = await loadOrderForUpdate();
            const dto = orderToUpdateDto(order, {
                fulfillmentContactName: order.fulfillmentContactName,
            });
            const result = await controller.updateOrderResponse(order.id, dto);
            expect(result.recipient).toEqual(order.recipient);
            expect(updateEntitySpy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when recipient changes', async () => {
            const order = await loadOrderForUpdate();
            const newRecipient = `${order.recipient} renamed ctrl`;
            const dto = orderToUpdateDto(order, { recipient: newRecipient });
            const result = await controller.updateOrderResponse(order.id, dto);
            expect(result.recipient).toEqual(newRecipient);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await orderRepo.findOne({ where: { id: order.id } });
            expect(row!.recipient).toEqual(newRecipient);
        });
    });

    it('remove deletes a created order then findOne fails', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const created = await controller.createOrderResponse(
            plainToInstance(CreateOrderDto, {
                recipient: 'Controller Order Remove',
                fulfillmentDate: new Date('2026-03-01'),
                fulfillmentType: 'pickup',
                categoryId: cat.id,
                orderedItems: [
                    plainToInstance(NestedCreateOrderMenuItemDto, {
                        createId: 'rm1',
                        menuItemId: mi.id,
                        sizeId: mi.sizes[0].id,
                        quantity: 1,
                    }),
                ],
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOneOrderResponse(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
