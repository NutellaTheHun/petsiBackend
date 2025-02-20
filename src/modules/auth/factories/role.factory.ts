import { Role } from "../entities/role.entities";
import { User } from "../entities/user.entities";
import { CreateRoleDto } from "../dto/create-role.dto";
import { plainToInstance } from "class-transformer";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { EntityFactory } from "../../../base/entity-factory";
import { AuthService } from "../auth.service";

//@Injectable()
export class RoleFactory {
    readonly entityFactory: EntityFactory<Role, CreateRoleDto, UpdateRoleDto>;
    readonly authService: AuthService;
    constructor(service: AuthService) {
         this.entityFactory = new EntityFactory<Role , CreateRoleDto, UpdateRoleDto>(Role, CreateRoleDto, UpdateRoleDto); 
         this.authService = service;
    }
    
    createDtoToEntity(roleDto: CreateRoleDto): Role{
        const users = this.authService.getUsers(roleDto.userIds);
        return plainToInstance(Role, { ...roleDto, users: users });
    }

    updateDtoToEntity(roleDto: UpdateRoleDto): Role {
        return plainToInstance(Role, { ...roleDto });
    }

    entityToCreateDto(role: Role): CreateRoleDto {
        return plainToInstance(CreateRoleDto, { ...role });
    }
    

    getDefaultRoles(): Role[] {
        return [
            this.createRoleInstance("admin", []),
            this.createRoleInstance("manager", []),
            this.createRoleInstance("staff", [])
            //this.entityFactory.createDtoToEntity({name:"admin", userIds: []})
        ];
    }

    getTestingRoles(): Role[]{
        return this.getDefaultRoles();
    }
    
    createRoleInstance(name:string, users: User[]): Role {
        const role = new Role();
        role.name = name;
        role.users = users;
        return role;
    }     
}
