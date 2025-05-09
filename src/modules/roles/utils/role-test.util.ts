import { Injectable } from "@nestjs/common";
import { RoleBuilder } from "../builders/role.builder";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { Role } from "../entities/role.entity";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../users/utils/constants";
import { RoleService } from "../services/role.service";

@Injectable()
export class RoleTestUtil {
    constructor(
        private readonly roleService: RoleService,
        private readonly roleBuilder: RoleBuilder,
    ){}

    public async getTestUserEntities(testContext: DatabaseTestContext): Promise<Role[]> {
        return [
            await this.roleBuilder.reset()
                .name(ROLE_ADMIN)
                .build(),
            await this.roleBuilder.reset()
                .name(ROLE_MANAGER)
                .build(),
            await this.roleBuilder.reset()
                .name(ROLE_STAFF)
                .build()
        ];
    }

    public async initRoleTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        const roles = await this.getTestUserEntities(testContext);
        const toInsert: Role[] = [];
        
        testContext.addCleanupFunction(() => this.cleanupRoleTestingDatabase());

        for(const role of roles){
            const exists = await this.roleService.findOneByName(role.name);
            if(!exists){ toInsert.push(role); }
        }

        await this.roleService.insertEntities(toInsert);
    }

    public async cleanupRoleTestingDatabase(): Promise<void> {
        await this.roleService.getQueryBuilder().delete().execute();
    }
}