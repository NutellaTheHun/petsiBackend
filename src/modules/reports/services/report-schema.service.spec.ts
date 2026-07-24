import { FIELD_REGISTRY } from '../registries';
import { ReportSchemaService } from './report-schema.service';

describe('ReportSchemaService', () => {
    let service: ReportSchemaService;

    beforeEach(() => {
        service = new ReportSchemaService();
    });

    it('returns all registered entity keys', () => {
        const schema = service.getSchema();
        const expectedKeys = Object.keys(FIELD_REGISTRY);
        expect(Object.keys(schema.entities)).toEqual(expect.arrayContaining(expectedKeys));
        expect(Object.keys(schema.entities).length).toBe(expectedKeys.length);
    });

    it('each entity has a label and non-empty fields map', () => {
        const schema = service.getSchema();
        for (const entity of Object.values(schema.entities)) {
            expect(entity.label).toBeTruthy();
            expect(Object.keys(entity.fields).length).toBeGreaterThan(0);
        }
    });

    it('each field carries dataType, filterable, aggregatable, groupable', () => {
        const schema = service.getSchema();
        for (const entity of Object.values(schema.entities)) {
            for (const field of Object.values(entity.fields)) {
                expect(field.dataType).toBeDefined();
                expect(typeof field.filterable).toBe('boolean');
                expect(typeof field.aggregatable).toBe('boolean');
                expect(typeof field.groupable).toBe('boolean');
            }
        }
    });

    it('enum fields have a non-empty options array', () => {
        const schema = service.getSchema();
        for (const entity of Object.values(schema.entities)) {
            for (const field of Object.values(entity.fields)) {
                if (field.dataType === 'enum') {
                    expect(Array.isArray(field.options)).toBe(true);
                    expect((field.options as string[]).length).toBeGreaterThan(0);
                }
            }
        }
    });

    it('schema response does not expose select, alias, or join', () => {
        const schema = service.getSchema();
        for (const entity of Object.values(schema.entities)) {
            for (const field of Object.values(entity.fields)) {
                expect((field as any).select).toBeUndefined();
                expect((field as any).alias).toBeUndefined();
                expect((field as any).join).toBeUndefined();
                expect((field as any).joins).toBeUndefined();
            }
        }
    });

    it('aggregatable fields carry aggregateFns', () => {
        const schema = service.getSchema();
        for (const entity of Object.values(schema.entities)) {
            for (const field of Object.values(entity.fields)) {
                if (field.aggregatable) {
                    expect(Array.isArray(field.aggregateFns)).toBe(true);
                    expect((field.aggregateFns as string[]).length).toBeGreaterThan(0);
                }
            }
        }
    });

    it('orders entity contains fulfillmentType as enum with pickup and delivery', () => {
        const schema = service.getSchema();
        const ordersEntity = schema.entities['orders'];
        expect(ordersEntity).toBeDefined();
        const fulfillmentType = ordersEntity.fields['fulfillmentType'];
        expect(fulfillmentType).toBeDefined();
        expect(fulfillmentType.dataType).toBe('enum');
        expect(fulfillmentType.options).toEqual(expect.arrayContaining(['pickup', 'delivery']));
    });

    it('orderMenuItems entity contains quantity as aggregatable number', () => {
        const schema = service.getSchema();
        const itemsEntity = schema.entities['orderMenuItems'];
        expect(itemsEntity).toBeDefined();
        const quantity = itemsEntity.fields['quantity'];
        expect(quantity).toBeDefined();
        expect(quantity.dataType).toBe('number');
        expect(quantity.aggregatable).toBe(true);
    });
});
