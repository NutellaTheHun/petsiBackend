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
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { Location } from '../entities/location.entity';
import { LocationTestUtil } from '../utils/location-test.util';
import { getLocationsTestingModule } from '../utils/locations-testing.module';
import { LocationController } from './location.controller';

const P = `t${Date.now()}`;

describe('LocationController', () => {
    let testingUtil: LocationTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: LocationController;
    let locationRepo: Repository<Location>;
    let tenantRepo: Repository<Tenant>;

    let tenant: Tenant;
    let locations: Location[];

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule();
        testingUtil = module.get<LocationTestUtil>(LocationTestUtil);
        controller = module.get(LocationController);
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

    it('create throws ValidationException when tenant does not exist', async () => {
        const dto = plainToInstance(CreateLocationDto, {
            tenantId: 9_999_999,
            name: `${P}-controller-location`,
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
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, [
                    'tenant',
                ]),
            );
        }
    });

    it('remove deletes a created location then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateLocationDto, {
                tenantId: tenant.id,
                name: `${P}-controller-location-remove`,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
