import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { Order } from '../entities/order.entity';
import { orderToUpdateDto } from '../utils/entity-transformers/order.dto.transformer';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderController } from './order.controller';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';

describe('order revision history (controller)', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: OrderController;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let menuItemRepo: Repository<MenuItem>;

    beforeAll(async () => {
        module = await getOrdersTestingModule({ mockRevisionHistory: false });
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
        await module.close();
    });

    it('creates revisions on create/update and records revert', async () => {
        const rhs = module.get(RevisionHistoryService);
        expect(typeof (rhs as any).listRevisions).toEqual('function');

        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const dto = plainToInstance(CreateOrderDto, {
            recipient: 'Revision History Order',
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

        const created = await controller.createOrderResponse(dto);
        const afterCreate = await rhs.listRevisions('order', created.id);
        expect(afterCreate.length).toBeGreaterThanOrEqual(1);
        expect(afterCreate[0].revisionNumber).toEqual(1);
        expect(afterCreate[0].changeLog.kind).toEqual('created');

        const row = await orderRepo.findOneOrFail({
            where: { id: created.id },
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
        const updateDto = orderToUpdateDto(row, { recipient: 'Revision History Order v2' });
        await controller.updateOrderResponse(created.id, updateDto);

        const afterUpdate = await rhs.listRevisions('order', created.id);
        expect(afterUpdate.length).toBeGreaterThanOrEqual(2);
        expect(afterUpdate[0].revisionNumber).toEqual(2);
        expect(afterUpdate[0].changeLog.kind).toEqual('updated');

        const reverted = await controller.revertOrder(created.id, 1);
        expect(reverted.recipient).toEqual('Revision History Order');

        const afterRevert = await rhs.listRevisions('order', created.id);
        expect(afterRevert[0].revisionNumber).toEqual(3);
        expect(afterRevert[0].changeLog.kind).toEqual('reverted');
    });

    it('serves changeLog and payload in detail endpoint', async () => {
        const rhs = module.get(RevisionHistoryService);
        expect(typeof (rhs as any).listRevisions).toEqual('function');

        const [cat] = await categoryRepo.find({ take: 1 });
        const [mi] = await menuItemRepo.find({ relations: ['sizes'], take: 1 });
        if (!cat || !mi?.sizes?.length) throw new Error('fixtures not found');

        const created = await controller.createOrderResponse(
            plainToInstance(CreateOrderDto, {
                recipient: 'Revision Detail Order',
                fulfillmentDate: new Date('2026-02-01'),
                fulfillmentType: 'pickup',
                categoryId: cat.id,
                orderedItems: [
                    plainToInstance(NestedCreateOrderMenuItemDto, {
                        createId: 'o1',
                        menuItemId: mi.id,
                        sizeId: mi.sizes[0].id,
                        quantity: 1,
                    }),
                ],
            }),
        );

        const revisions = await rhs.listRevisions('order', created.id);
        if (!revisions.length) throw new Error('expected order to have revisions');

        const rev = await rhs.getRevisionOrThrow(
            'order',
            created.id,
            revisions[0].revisionNumber,
        );
        expect(rev.revisionNumber).toEqual(revisions[0].revisionNumber);
        expect(rev.changeLog).toBeDefined();
        expect(rev.payload).toBeDefined();
    });
});

