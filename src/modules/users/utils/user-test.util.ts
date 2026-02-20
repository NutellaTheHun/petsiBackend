import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { Role } from '../../roles/entities/role.entity';
import { RoleTestUtil } from '../../roles/utils/role-test.util';
import { UserBuilder } from '../builders/user.builder';
import { User } from '../entities/user.entities';
import { USER_A, USER_B, USER_C, USER_D, USER_E } from './constants';

@Injectable()
export class UserTestUtil {
    private readonly usernames = [USER_A, USER_B, USER_C, USER_D, USER_E];
    private readonly emails = [
        'EMAIL_A@EMAIL.COM',
        'EMAIL_B@EMAIL.COM',
        'EMAIL_C@EMAIL.COM',
        'EMAIL_D@EMAIL.COM',
        'EMAIL_E@EMAIL.COM',
    ];

    private initUsers = false;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly userBuilder: UserBuilder,

        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        private readonly roleTestUtil: RoleTestUtil,
    ) { }

    public async getTestUserEntities(
        testContext: DatabaseTestContext,
    ): Promise<User[]> {
        await this.roleTestUtil.initRoleTestingDatabase(testContext);

        const roles = (await this.roleRepo.find()).map((role) => role.id);

        const results: User[] = [];
        for (let i = 0; i < this.usernames.length; i++) {
            results.push(
                await this.userBuilder
                    .reset()
                    .email(this.emails[i])
                    .password(`password${i}`)
                    .name(this.usernames[i])
                    .roles([roles[i % roles.length]])
                    .build(),
            );
        }
        return results;
    }

    public async initUserTestingDatabase(
        testContext: DatabaseTestContext,
    ): Promise<void> {
        if (this.initUsers) {
            return;
        }
        this.initUsers = true;

        const users = await this.getTestUserEntities(testContext);

        testContext.addCleanupFunction(() => this.cleanupUserTestingDatabase());

        await this.userRepo.insert(users);
    }

    public async cleanupUserTestingDatabase(): Promise<void> {
        //await this.userRepo.delete({});
        await this.userRepo.deleteAll();
    }
}
