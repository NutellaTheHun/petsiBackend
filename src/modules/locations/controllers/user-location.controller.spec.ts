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
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entities';
import { UserTestUtil } from '../../users/utils/user-test.util';
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { Location } from '../entities/location.entity';
import { UserLocation } from '../entities/user-location.entity';
import { getLocationsTestingModule } from '../utils/locations-testing.module';
import { LocationTestUtil } from '../utils/location-test.util';
import { UserLocationController } from './user-location.controller';

const P = `t${Date.now()}`;

describe('UserLocationController', () => {
    let locationTestUtil: LocationTestUtil;
    let userTestUtil: UserTestUtil;
    let roleTestUtil: RoleTestUtil;
    let testCtx: DatabaseTestContext;
    let requestContext: TestRequestContextService;
    let controller: UserLocationController;
    let userLocationRepo: Repository<UserLocation>;

    let tenant: Tenant;
    let location: Location;
    let users: User[];
    let roles: Role[];

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule();
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        userTestUtil = module.get<UserTestUtil>(UserTestUtil);
        roleTestUtil = module.get<RoleTestUtil>(RoleTestUtil);
        controller = module.get(UserLocationController);
        userLocationRepo = module.get(getRepositoryToken(UserLocation));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        ({ tenant, locations: [location] } = await locationTestUtil.seedLocations(P, undefined, 1));
        ({ users } = await userTestUtil.seedUsers(P, tenant.id));
        ({ roles } = await roleTestUtil.seedRoles(P, tenant.id));

        requestContext.setContext({
            tenantId: tenant.id,
            isTenantAdmin: false,
            locations: [{ locationId: location.id, roles: ['staff'] }],
        });
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('create throws ValidationException when userId does not exist', async () => {
        const dto = plainToInstance(CreateUserLocationDto, {
            userId: 9_999_999,
            locationId: location.id,
            roleIds: [roles[0].id],
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
                createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['user']),
            );
        }
    });

    it('remove deletes a created assignment then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateUserLocationDto, {
                userId: users[0].id,
                locationId: location.id,
                roleIds: [roles[0].id],
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(NotFoundException);
    });
});
