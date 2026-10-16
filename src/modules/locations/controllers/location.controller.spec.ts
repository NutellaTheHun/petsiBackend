import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
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
        (module.get(RequestContextService) as TestRequestContextService).setContext({ tenantId: tenant.id });
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

    it('remove deletes a created location then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateLocationDto, {
                name: `${P}-controller-location-remove`,
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });
});
