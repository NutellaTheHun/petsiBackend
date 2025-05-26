import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { RoleTestUtil } from "../../roles/utils/role-test.util";
import { UserBuilder } from "../builders/user.builder";
import { User } from "../entities/user.entities";
import { UserService } from "../services/user.service";
import { USER_A, USER_B, USER_C, USER_D, USER_E } from "./constants";
import { RoleService } from "../../roles/services/role.service";

@Injectable()
export class UserTestUtil {
    private readonly usernames = [USER_A, USER_B, USER_C, USER_D, USER_E];
    private readonly emails = ["EMAIL_A@EMAIL.COM", "EMAIL_B@EMAIL.COM", "EMAIL_C@EMAIL.COM", "EMAIL_D@EMAIL.COM", "EMAIL_E@EMAIL.COM"]

    private initUsers = false;

    constructor(
        private readonly roleTestUtil: RoleTestUtil,
        private readonly userService: UserService,
        private readonly userBuilder: UserBuilder,
        private readonly roleService: RoleService,
    ) { }

    public async getTestUserEntities(testContext: DatabaseTestContext): Promise<User[]> {
        await this.roleTestUtil.initRoleTestingDatabase(testContext);

        const roles = (await this.roleService.findAll()).items.map(role => role.id);

        const results: User[] = [];
        for (let i = 0; i < this.usernames.length; i++) {
            results.push(
                await this.userBuilder.reset()
                    .email(this.emails[i])
                    .password(`password${i}`)
                    .username(this.usernames[i])
                    .roles([roles[i % roles.length]])
                    .build()
            );
        }
        return results;
    }

    public async initUserTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        if (this.initUsers) {
            return;
        }
        this.initUsers = true;

        const users = await this.getTestUserEntities(testContext);

        testContext.addCleanupFunction(() => this.cleanupUserTestingDatabase());

        await this.userService.insertEntities(users);
    }

    public async cleanupUserTestingDatabase(): Promise<void> {
        await this.userService.getQueryBuilder().delete().execute();
    }
}