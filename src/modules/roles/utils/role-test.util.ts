import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { RoleBuilder } from '../builders/role.builder';
import { Role } from '../entities/role.entity';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from './constants';

@Injectable()
export class RoleTestUtil {
    private initRoles = false;

    constructor(
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        private readonly roleBuilder: RoleBuilder,
    ) { }

    public async getTestRoleEntities(
        testContext: DatabaseTestContext,
    ): Promise<Role[]> {
        return [
            await this.roleBuilder.reset().roleName(ROLE_ADMIN).build(),
            await this.roleBuilder.reset().roleName(ROLE_MANAGER).build(),
            await this.roleBuilder.reset().roleName(ROLE_STAFF).build(),
        ];
    }

    public async initRoleTestingDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initRoles) {
            return;
        }
        this.initRoles = true;

        testContext.addCleanupFunction(() => this.cleanupRoleTestingDatabase());

        const roles = await this.getTestRoleEntities(testContext);
        for (const role of roles) {
            const exists = await this.roleRepo.findOne({
                where: { name: role.name },
            });
            if (!exists) {
                await this.roleRepo.save(role);
            }
        }
    }

    public async cleanupRoleTestingDatabase(): Promise<void> {
        //await this.roleRepo.deleteAll();
        await this.roleRepo.query(`TRUNCATE TABLE role CASCADE`);
    }

    // ─── Atomic-prefix seed methods ─────────────────────────────────────────────
    // These do not register cleanup — callers are responsible for deleting by ID.

    public async seedRoles(P: string = ''): Promise<{ roles: Role[] }> {
        const names = ['role-a', 'role-b', 'role-c'];
        const roles: Role[] = [];
        for (const name of names) {
            const entityName = P ? `${P}-${name}` : name;
            const entity = await this.roleBuilder.reset().roleName(entityName).build();
            roles.push(await this.roleRepo.save(entity));
        }
        return { roles };
    }
}
