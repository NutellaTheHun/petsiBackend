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

        await this.roleRepo.insert(await this.getTestRoleEntities(testContext));
    }

    public async cleanupRoleTestingDatabase(): Promise<void> {
        //await this.roleRepo.delete({});
        await this.roleRepo.deleteAll();
    }
}
