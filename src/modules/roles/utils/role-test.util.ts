import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { RoleBuilder } from "../builders/role.builder";
import { Role } from "../entities/role.entity";
import { RoleService } from "../services/role.service";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "./constants";

@Injectable()
export class RoleTestUtil {

    private initRoles = false;

    constructor(
        private readonly roleService: RoleService,
        private readonly roleBuilder: RoleBuilder,
    ){}

    public async getTestUserEntities(testContext: DatabaseTestContext): Promise<Role[]> {
        return [
            await this.roleBuilder.reset()
                .roleName(ROLE_ADMIN)
                .build(),
            await this.roleBuilder.reset()
                .roleName(ROLE_MANAGER)
                .build(),
            await this.roleBuilder.reset()
                .roleName(ROLE_STAFF)
                .build()
        ];
    }

    public async initRoleTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        if(this.initRoles){ 
            return; 
        }
        this.initRoles = true;

        const roles = await this.getTestUserEntities(testContext);
        //const toInsert: Role[] = [];
        
        testContext.addCleanupFunction(() => this.cleanupRoleTestingDatabase());

        /*for(const role of roles){
            const exists = await this.roleService.findOneByName(role.roleName);
            if(!exists){ toInsert.push(role); }
        }*/

        await this.roleService.insertEntities(/*toInsert*/ roles);
    }

    public async cleanupRoleTestingDatabase(): Promise<void> {
        await this.roleService.getQueryBuilder().delete().execute();
    }
}