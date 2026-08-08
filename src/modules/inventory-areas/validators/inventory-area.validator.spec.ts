import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { Location } from '../../locations/entities/location.entity';
import { LocationTestUtil } from '../../locations/utils/location-test.util';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaValidator } from './inventory-area.validator';

const P = `t${Date.now()}`;

describe('inventory area validator', () => {
    let testingUtil: InventoryAreaTestUtil;
    let locationTestUtil: LocationTestUtil;
    let testCtx: DatabaseTestContext;
    let requestContext: TestRequestContextService;

    let validator: InventoryAreaValidator;
    let areaRepo: Repository<InventoryArea>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let locationA: Location;
    let locationB: Location;
    let areas: InventoryArea[];

    beforeAll(async () => {
        const module: TestingModule = await getInventoryAreasTestingModule();
        testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        validator = module.get<InventoryAreaValidator>(InventoryAreaValidator);
        areaRepo = module.get(getRepositoryToken(InventoryArea));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [locationA, locationB] } =
            await locationTestUtil.seedLocations(P, undefined, 2));
        requestContext.setContext({ tenantId: tenant.id });

        ({ areas } = await testingUtil.seedAreas(P, tenant.id, locationA.id));
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

    it('successfully validate create: no validation errors', async () => {
        const dto: CreateInventoryAreaDto = plainToInstance(CreateInventoryAreaDto, {
            name: `${P}-new-area`,
            locationId: locationA.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateInventoryAreaDto = plainToInstance(CreateInventoryAreaDto, {
            name: areas[0].name,
            locationId: locationA.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('allows the same name at a different location', async () => {
        const dto: CreateInventoryAreaDto = plainToInstance(CreateInventoryAreaDto, {
            name: areas[0].name,
            locationId: locationB.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateInventoryAreaDto = plainToInstance(UpdateInventoryAreaDto, {
            name: `${P}-updated-area`,
            locationId: locationA.id,
        });

        const errors = await validator.validateDto(dto, areas[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const dto: UpdateInventoryAreaDto = plainToInstance(UpdateInventoryAreaDto, {
            name: areas[1].name,
            locationId: locationA.id,
        });

        const errors = await validator.validateDto(dto, areas[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });
});
