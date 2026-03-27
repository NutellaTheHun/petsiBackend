import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { OrderCategory } from '../../entities/order-category.entity';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';
import { Order } from '../../entities/order.entity';
import { RecurringOrderSchedule } from '../../entities/recurring-order-schedule.entity';
import { UpdateOrderDto } from '../../dto/order/update-order.dto';
import { orderToUpdateDto } from '../entity-transformers/order.dto.transformer';
import { orderMenuItemToNestedUpdateDto } from '../entity-transformers/order-menu-item.dto.transformer';
import { recurringOrderScheduleToNestedUpdateDto } from '../entity-transformers/recurring-order-schedule.dto.transformer';
import { OrderMenuItemChangeDetector } from './order-menu-item.change-detector';
import { OrderContainerItemChangeDetector } from './order-container-item.change-detector';
import { RecurringOrderScheduleChangeDetector } from './recurring-order-schedule.change-detector';
import { OrderChangeDetector } from './order.change-detector';

const RRULE_WEEKLY_MO = 'DTSTART:20120201T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO';

describe('OrderChangeDetector', () => {
    const detector = new OrderChangeDetector(
        new OrderMenuItemChangeDetector(new OrderContainerItemChangeDetector()),
        new RecurringOrderScheduleChangeDetector(),
    );

    const lineItem = (): OrderMenuItem =>
        ({
            id: 200,
            menuItem: { id: 1 } as MenuItem,
            size: { id: 2 } as MenuItemSize,
            quantity: 1,
            containerOrderMenuItems: [],
            parentOrder: {} as Order,
        } as OrderMenuItem);

    const baseOrder = (): Order =>
        ({
            id: 1,
            recipient: 'Pat',
            fulfillmentDate: new Date('2025-06-01T12:00:00.000Z'),
            fulfillmentType: 'pickup',
            fulfillmentContactName: undefined,
            deliveryAddress: undefined,
            phoneNumber: undefined,
            email: undefined,
            note: undefined,
            isFrozen: false,
            category: { id: 10 } as OrderCategory,
            occurrenceType: undefined,
            occurrenceState: undefined,
            orderedItems: [lineItem()],
            recurrenceSchedule: null,
        } as unknown as Order);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseOrder();
        const dto = orderToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects recipient change', () => {
        const entity = baseOrder();
        const dto = orderToUpdateDto(entity, { recipient: 'Sam' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ recipient: 'Sam' });
    });

    it('patches only changed ordered line item', () => {
        const entity = baseOrder();
        const li = lineItem();
        const dto: UpdateOrderDto = {
            ...orderToUpdateDto(entity),
            orderedItems: [orderMenuItemToNestedUpdateDto(li, { quantity: 5 })],
        };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.orderedItems).toEqual([{ id: 200, quantity: 5 }]);
    });

    it('returns empty nested patch when recurrence matches', () => {
        const ros = {
            id: 1,
            rrule: RRULE_WEEKLY_MO,
            startDate: new Date('2012-02-01T09:30:00.000Z'),
        } as RecurringOrderSchedule;
        const entity = { ...baseOrder(), recurrenceSchedule: ros };
        const dto = orderToUpdateDto(entity, {
            recurrenceSchedule: recurringOrderScheduleToNestedUpdateDto(ros),
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch.recurrenceSchedule).toBeUndefined();
    });

    it('detects recurrence schedule change', () => {
        const ros = {
            id: 1,
            rrule: RRULE_WEEKLY_MO,
            startDate: new Date('2012-02-01T09:30:00.000Z'),
        } as RecurringOrderSchedule;
        const entity = { ...baseOrder(), recurrenceSchedule: ros };
        const nested = recurringOrderScheduleToNestedUpdateDto(ros, { frequency: 'MONTHLY' });
        const dto = orderToUpdateDto(entity, { recurrenceSchedule: nested });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.recurrenceSchedule).toEqual(nested);
    });
});
