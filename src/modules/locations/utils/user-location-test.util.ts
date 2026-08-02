import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { User } from '../../users/entities/user.entities';
import { UserTestUtil } from '../../users/utils/user-test.util';
import { UserLocation } from '../entities/user-location.entity';
import { LocationTestUtil } from './location-test.util';

@Injectable()
export class UserLocationTestUtil {
    constructor(
        @InjectRepository(UserLocation)
        private readonly userLocationRepo: Repository<UserLocation>,

        private readonly locationTestUtil: LocationTestUtil,
        private readonly userTestUtil: UserTestUtil,
        private readonly roleTestUtil: RoleTestUtil,
    ) { }

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedUserLocations(P: string = ''): Promise<{
        tenant: { id: number };
        location: Location;
        otherLocation: Location;
        users: User[];
        roles: Role[];
        userLocations: UserLocation[];
    }> {
        const { tenant, locations: [location, otherLocation] } =
            await this.locationTestUtil.seedLocations(P, undefined, 2);
        const { users } = await this.userTestUtil.seedUsers(P, tenant.id);
        const { roles } = await this.roleTestUtil.seedRoles(P, tenant.id);

        const userLocations: UserLocation[] = [];
        for (let i = 0; i < users.length; i++) {
            const entity = this.userLocationRepo.create({
                tenantId: tenant.id,
                locationId: location.id,
                user: users[i],
                roles: [roles[i % roles.length]],
            });
            userLocations.push(await this.userLocationRepo.save(entity));
        }

        return { tenant, location, otherLocation, users, roles, userLocations };
    }
}
