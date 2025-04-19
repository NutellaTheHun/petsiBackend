import { Injectable } from "@nestjs/common";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { User } from "../entities/user.entities";
import { UserBuilder } from "../builders/user.builder";
import { UserService } from "../services/user.service";
import { USER_A, USER_B, USER_C, USER_D, USER_E } from "./constants";

@Injectable()
export class UserTestUtil {
    private readonly usernames = [USER_A, USER_B, USER_C, USER_D, USER_E];
    private readonly emails = ["EMAIL_A@EMAIL.COM", "EMAIL_B@EMAIL.COM", "EMAIL_C@EMAIL.COM", "EMAIL_D@EMAIL.COM", "EMAIL_E@EMAIL.COM" ]
    constructor(
        private readonly userService: UserService,
        private readonly userBuilder: UserBuilder,
    ){ }

    public async getTestUserEntities(testContext: DatabaseTestContext): Promise<User[]> {
        const results: User[] = [];
        for(let i = 0; i < this.usernames.length; i++){
            results.push(
                await this.userBuilder.reset()
                    .email(this.emails[i])
                    .password(`password${i}`)
                    .username(this.usernames[i])
                    .build()
            );
        }
        return results;
    }

    public async initUserTestingDatabase(testContext: DatabaseTestContext): Promise<void> {
        const users = await this.getTestUserEntities(testContext);
        const toInsert: User[] = [];
        
        testContext.addCleanupFunction(() => this.cleanupUserTestingDatabase());

        for(const user of users){
            const exists = await this.userService.findOneByName(user.username);
            if(!exists){ toInsert.push(user); }
        }

        await this.userService.insertEntities(toInsert);
    }

    public async cleanupUserTestingDatabase(): Promise<void> {
        await this.userService.getQueryBuilder().delete().execute();
    }
}