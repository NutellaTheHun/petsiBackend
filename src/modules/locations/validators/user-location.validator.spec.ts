import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entities';
import { UserTestUtil } from '../../users/utils/user-test.util';
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { UpdateUserLocationDto } from '../dto/update-user-location.dto';
import { Location } from '../entities/location.entity';
import { getLocationsTestingModule } from '../utils/locations-testing.module';
import { LocationTestUtil } from '../utils/location-test.util';
import { UserLocationValidator } from './user-location.validator';

const P = `t${Date.now()}`;

describe('user location validator', () => {
    let locationTestUtil: LocationTestUtil;
    let userTestUtil: UserTestUtil;
    let roleTestUtil: RoleTestUtil;
    let testCtx: DatabaseTestContext;
    let requestContext: TestRequestContextService;

    let validator: UserLocationValidator;

    let tenant: Tenant;
    let location: Location;
    let users: User[];
    let roles: Role[];

    beforeAll(async () => {
        const module: TestingModule = await getLocationsTestingModule();
        locationTestUtil = module.get<LocationTestUtil>(LocationTestUtil);
        userTestUtil = module.get<UserTestUtil>(UserTestUtil);
        roleTestUtil = module.get<RoleTestUtil>(RoleTestUtil);
        validator = module.get<UserLocationValidator>(UserLocationValidator);
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

    it('successfully validates create: no validation errors', async () => {
        const dto = plainToInstance(CreateUserLocationDto, {
            userId: users[0].id,
            locationId: location.id,
            roleIds: [roles[0].id],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fails validate create: userId does not exist', async () => {
        const dto = plainToInstance(CreateUserLocationDto, {
            userId: 9_999_999,
            locationId: location.id,
            roleIds: [roles[0].id],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['user']),
        );
    });

    it('fails validate create: a roleId does not exist', async () => {
        const dto = plainToInstance(CreateUserLocationDto, {
            userId: users[0].id,
            locationId: location.id,
            roleIds: [9_999_999],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['roles']),
        );
    });

    it('successfully validates update: no validation errors', async () => {
        const dto = plainToInstance(UpdateUserLocationDto, {
            locationId: location.id,
            roleIds: [roles[1].id],
        });

        const errors = await validator.validateDto(dto, 1);
        expect(errors).toBeNull();
    });
});
