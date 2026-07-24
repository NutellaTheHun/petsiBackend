import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location } from '../entities/location.entity';
import { LocationTestUtil } from '../utils/location-test.util';
import { getLocationsTestingModule } from '../utils/locations-testing.module';
import { LocationValidator } from './location.validator';

const P = `t${Date.now()}`;

describe('location validator', () => {
    let testingUtil: LocationTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: LocationValidator;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let locations: Location[];

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule();
        testingUtil = module.get<LocationTestUtil>(LocationTestUtil);
        validator = module.get<LocationValidator>(LocationValidator);
        locationRepo = module.get(getRepositoryToken(Location));
        tenantRepo = module.get(getRepositoryToken(Tenant));

        ({ tenant, locations } = await testingUtil.seedLocations(P));
    });

    afterAll(async () => {
        await locationRepo.delete(locations.map((l) => l.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateLocationDto = plainToInstance(CreateLocationDto, {
            tenantId: tenant.id,
            name: `${P}-new-location-name`,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: tenant does not exist', async () => {
        const dto: CreateLocationDto = plainToInstance(CreateLocationDto, {
            tenantId: 9_999_999,
            name: `${P}-orphan-location`,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['tenant']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const dto: UpdateLocationDto = plainToInstance(UpdateLocationDto, {
            tenantId: tenant.id,
            name: `${P}-updated-location-name`,
        });

        const errors = await validator.validateDto(dto, locations[0].id);
        expect(errors).toBeNull();
    });

    it('fail validate update: tenant does not exist', async () => {
        const dto: UpdateLocationDto = plainToInstance(UpdateLocationDto, {
            tenantId: 9_999_999,
            name: locations[0].name,
        });

        const errors = await validator.validateDto(dto, locations[0].id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['tenant']),
        );
    });
});
