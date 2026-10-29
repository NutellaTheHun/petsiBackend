import { plainToInstance } from 'class-transformer';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { orderToUpdateDto } from './entity-transformers/order.dto.transformer';
import { orderMenuItemToNestedUpdateDto } from './entity-transformers/order-menu-item.dto.transformer';
import { squareOwnershipViolations } from './square-ownership';

const SQUARE_BOX = 10;
const SQUARE_PIE = 11;
const STAFF_SCONE = 12;

const containerItem = (
    id: number,
    menuItemId: number,
    quantity: number,
): OrderContainerItem =>
    ({
        id,
        containedMenuItem: { id: menuItemId } as MenuItem,
        containedItemSize: { id: 1 } as MenuItemSize,
        quantity,
    }) as OrderContainerItem;

const item = (
    id: number,
    menuItemId: number,
    quantity: number,
    contents: OrderContainerItem[] = [],
): OrderMenuItem =>
    ({
        id,
        menuItem: { id: menuItemId } as MenuItem,
        size: { id: 1 } as MenuItemSize,
        quantity,
        containerOrderMenuItems: contents,
    }) as OrderMenuItem;

const order = (): Order =>
    ({
        id: 1,
        recipient: 'Jane Doe',
        fulfillmentDate: new Date('2026-11-02T15:00:00.000Z'),
        fulfillmentType: 'pickup',
        fulfillmentContactName: null,
        deliveryAddress: null,
        phoneNumber: '555-0100',
        email: 'jane@example.com',
        note: null,
        isFrozen: false,
        locationId: 1,
        category: null,
        orderedItems: [
            item(SQUARE_BOX, 100, 1, [
                containerItem(1000, 200, 4),
                containerItem(1001, 201, 2),
            ]),
            item(SQUARE_PIE, 101, 2),
            item(STAFF_SCONE, 102, 3),
        ],
    }) as unknown as Order;

const squareLineIds = new Set([SQUARE_BOX, SQUARE_PIE]);

const updateDto = (plain: Record<string, unknown>) =>
    plainToInstance(UpdateOrderDto, plain);

/** The order's items as nested update DTOs, with `pick` applied per id. */
const itemsDto = (
    current: Order,
    pick: Record<number, Record<string, unknown> | null> = {},
) =>
    current.orderedItems.flatMap((existing) => {
        if (pick[existing.id] === null) return [];
        return [
            {
                ...orderMenuItemToNestedUpdateDto(existing),
                ...pick[existing.id],
            },
        ];
    });

describe('squareOwnershipViolations', () => {
    const none = { fields: [], removedLineIds: [], changedLines: [] };

    it('passes a full DTO that echoes the order', () => {
        const current = order();
        expect(
            squareOwnershipViolations(
                current,
                squareLineIds,
                orderToUpdateDto(current),
            ),
        ).toEqual(none);
    });

    it('passes Petsi-owned changes: category, freeze, note, contact name, staff lines', () => {
        const current = order();
        const dto = updateDto({
            categoryId: 5,
            isFrozen: true,
            note: 'internal',
            fulfillmentContactName: 'Pat',
            orderedItems: [
                ...itemsDto(current, {
                    [STAFF_SCONE]: { quantity: 9 },
                }),
                plainToInstance(NestedCreateOrderMenuItemDto, {
                    createId: 'staff',
                    menuItemId: 103,
                    sizeId: 1,
                    quantity: 1,
                }),
            ],
        });
        expect(squareOwnershipViolations(current, squareLineIds, dto)).toEqual(
            none,
        );
    });

    it('passes removing a staff line', () => {
        const current = order();
        const dto = updateDto({
            orderedItems: itemsDto(current, { [STAFF_SCONE]: null }),
        });
        expect(squareOwnershipViolations(current, squareLineIds, dto)).toEqual(
            none,
        );
    });

    it('reports each changed Square-owned field', () => {
        const dto = updateDto({
            recipient: 'Someone Else',
            fulfillmentDate: '2026-11-03T15:00:00.000Z',
            fulfillmentType: 'delivery',
            phoneNumber: null,
            email: 'other@example.com',
            deliveryAddress: '1 Main St',
        });
        expect(squareOwnershipViolations(order(), squareLineIds, dto)).toEqual({
            ...none,
            fields: [
                'recipient',
                'fulfillmentDate',
                'fulfillmentType',
                'phoneNumber',
                'email',
                'deliveryAddress',
            ],
        });
    });

    it('treats an equal date string as unchanged', () => {
        const dto = updateDto({
            fulfillmentDate: '2026-11-02T15:00:00.000Z',
        });
        expect(squareOwnershipViolations(order(), squareLineIds, dto)).toEqual(
            none,
        );
    });

    it('reports a removed Square line', () => {
        const current = order();
        const dto = updateDto({
            orderedItems: itemsDto(current, { [SQUARE_PIE]: null }),
        });
        expect(squareOwnershipViolations(current, squareLineIds, dto)).toEqual({
            ...none,
            removedLineIds: [SQUARE_PIE],
        });
    });

    it('reports a changed Square line and changed box contents', () => {
        const current = order();
        const dto = updateDto({
            orderedItems: itemsDto(current, {
                [SQUARE_PIE]: { quantity: 3, menuItemId: 999 },
                [SQUARE_BOX]: {
                    containerOrderMenuItems: [
                        {
                            id: 1000,
                            containedMenuItemId: 200,
                            containedItemSizeId: 1,
                            quantity: 6,
                        },
                    ],
                },
            }),
        });
        expect(squareOwnershipViolations(current, squareLineIds, dto)).toEqual({
            ...none,
            changedLines: [
                { id: SQUARE_BOX, fields: ['containerOrderMenuItems'] },
                { id: SQUARE_PIE, fields: ['menuItemId', 'quantity'] },
            ],
        });
    });

    it('reports a flavor added to a Square box', () => {
        const current = order();
        const box = current.orderedItems[0];
        const dto = updateDto({
            orderedItems: itemsDto(current, {
                [SQUARE_BOX]: {
                    containerOrderMenuItems: [
                        ...orderMenuItemToNestedUpdateDto(box)
                            .containerOrderMenuItems!,
                        {
                            createId: 'c1',
                            containedMenuItemId: 202,
                            containedItemSizeId: 1,
                            quantity: 1,
                            parentMenuItemIdCtx: 100,
                            parentMenuItemSizeIdCtx: 1,
                        },
                    ],
                },
            }),
        });
        expect(
            squareOwnershipViolations(current, squareLineIds, dto).changedLines,
        ).toEqual([{ id: SQUARE_BOX, fields: ['containerOrderMenuItems'] }]);
    });
});
