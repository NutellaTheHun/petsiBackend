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
    let areas: InventoryArea[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        controller = module.get<InventoryAreaController>(InventoryAreaController);
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [location] } = await locationTestUtil.seedLocations(P, undefined, 1));
        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: location.id, roles: ['staff'] }],
        });

        ({ areas } = await testingUtil.seedAreas(P, tenant.id, location.id));
    });

    afterAll(async () => {
        await areaRepo.delete(areas.map((a) => a.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
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
});
