import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RoleService } from "../roles/services/role.service";
import { UserService } from "../users/services/user.service";

@Injectable()
export class SeedService {
    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly configService: ConfigService
    ) { }

    async seed() {
        // Seed Roles
        const roles = ['admin', 'manager', 'staff'];
        for (const role of roles) {
            const roleExists = await this.roleService.findOneByName(role);
            if (!roleExists) {
                await this.roleService.create({
                    roleName: role
                });
            }
        }

        // Seed Admin account
        const adminExists = await this.userService.findOneByName('admin');
        if (!adminExists) {
            const pwrd = this.configService.get('seed_admin_pwrd') || 'error';
            if (!pwrd) { throw new Error(); }

            const roles = await this.roleService.findAll();

            await this.userService.create({
                username: 'admin',
                password: pwrd,
                roleIds: roles.items.map(role => role.id)
            })
        }

        // Seed Menu Item Sizes

        // Seed Units Of Measure (and categories)
    }
}