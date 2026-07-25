import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaController } from './inventory-area.controller';

const P = `t${Date.now()}`;

describe('inventory area controller', () => {
    let testingUtil: InventoryAreaTestUtil;
    let locationTestUtil: LocationTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: InventoryAreaController;
    let areaRepo: Repository<InventoryArea>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let location: Location;
    let otherLocation: Location;
    let areas: InventoryArea[];
    let otherLocationAreas: InventoryArea[];

    const staffAtLocationContext = () => ({
        tenantId: tenant.id,
        isTenantAdmin: false,
        locations: [{ locationId: location.id, roles: ['staff'] }],
    });

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        controller = module.get<InventoryAreaController>(InventoryAreaController);
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [location, otherLocation] } = await locationTestUtil.seedLocations(
            P,
            undefined,
            2,
        ));
        requestContext.setContext(staffAtLocationContext());

        ({ areas } = await testingUtil.seedAreas(P, tenant.id, location.id));
        ({ areas: otherLocationAreas } = await testingUtil.seedAreas(
            `${P}-other-loc`,
            tenant.id,
            otherLocation.id,
        ));
    });

    afterAll(async () => {
        await areaRepo.delete([
            ...areas.map((a) => a.id),
            ...otherLocationAreas.map((a) => a.id),
        ]);
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
        requestContext.setContext(staffAtLocationContext());
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateInventoryAreaDto, {
            name: areas[0].name,
            locationId: location.id,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, [
                    'name',
                ]),
            );
        }
    });

    it('remove deletes an area then findOne fails', async () => {
        const dto = plainToInstance(CreateInventoryAreaDto, {
            name: `${P}-to-remove`,
            locationId: location.id,
        });
        const created = await controller.create(dto);
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('location-scoped caching', () => {
        it('findOne cache does not leak across location contexts within the same tenant', async () => {
            requestContext.setContext(staffAtLocationContext());
            const cached = await controller.findOne(areas[0].id);
            expect(cached.id).toBe(areas[0].id);

            requestContext.setContext({
                tenantId: tenant.id,
                isTenantAdmin: false,
                locations: [{ locationId: otherLocation.id, roles: ['staff'] }],
            });
            await expect(controller.findOne(areas[0].id)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('findAll cache does not leak across location contexts within the same tenant', async () => {
            requestContext.setContext(staffAtLocationContext());
            const ownResult = await controller.findAll(undefined, 100);
            expect(ownResult.items.find((a) => a.id === areas[0].id)).toBeDefined();
            expect(
                ownResult.items.find((a) => a.id === otherLocationAreas[0].id),
            ).toBeUndefined();

            requestContext.setContext({
                tenantId: tenant.id,
                isTenantAdmin: false,
                locations: [{ locationId: otherLocation.id, roles: ['staff'] }],
            });
            const otherResult = await controller.findAll(undefined, 100);
            expect(otherResult.items.find((a) => a.id === areas[0].id)).toBeUndefined();
            expect(
                otherResult.items.find((a) => a.id === otherLocationAreas[0].id),
            ).toBeDefined();
        });

        it('create at one location invalidates the findAll cache for other location views in the same tenant', async () => {
            const adminContext = {
                tenantId: tenant.id,
                isTenantAdmin: true,
                locations: [],
            };
            requestContext.setContext(adminContext);
            await controller.findAll(undefined, 100); // primes the admin's (tenant-wide) findAll cache

            requestContext.setContext(staffAtLocationContext());
            const created = await controller.create(
                plainToInstance(CreateInventoryAreaDto, {
                    name: `${P}-invalidation-check`,
                    locationId: location.id,
                }),
            );

            requestContext.setContext(adminContext);
            const afterCreate = await controller.findAll(undefined, 100);
            expect(afterCreate.items.find((a) => a.id === created.id)).toBeDefined();

            requestContext.setContext(staffAtLocationContext());
            await controller.remove(created.id);
        });
    });
});
