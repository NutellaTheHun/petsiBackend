import { TestingModule } from "@nestjs/testing";
import { RoleService } from "../roles/services/role.service";
import { UserService } from "../users/services/user.service";
import { getSeedTestingModule } from "./seed-testing.module";
import { SeedService } from "./seed.service";

describe('Seed Service', () => {

    let seedService: SeedService;
    let userServce: UserService;
    let roleService: RoleService;

    beforeAll(async () => {
        const module: TestingModule = await getSeedTestingModule();
        seedService = module.get<SeedService>(SeedService);
        userServce = module.get<UserService>(UserService);
        roleService = module.get<RoleService>(RoleService);
    });

    afterAll(async () => {
        userServce.getQueryBuilder().delete().execute();
        roleService.getQueryBuilder().delete().execute();
    });

    it('should be defined', () => {
        expect(seedService).toBeDefined();
    });

    it('should seed the database', async () => {
        await seedService.seed();

        const roles = await roleService.findAll();
        expect(roles.items.length).toEqual(3);

        const users = await userServce.findAll();
        expect(users.items.length).toEqual(1);
    });
});