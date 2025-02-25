import { Role } from "./role.entities";
import { CreateDefaultDtoValues, CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { EntityFactory } from "../../../base/entity-factory";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RoleFactory extends EntityFactory<Role, CreateRoleDto, UpdateRoleDto>{

    constructor() {
        super( Role, CreateRoleDto, UpdateRoleDto, CreateDefaultDtoValues());
    }

    getDefaultRoles(): Role[] {
        return [
            this.createEntityInstance({name: "admin" }),
            this.createEntityInstance({name: "manager" }),
            this.createEntityInstance({name: "staff" })
        ];
    }

    getTestingRoles(): Role[]{
        return this.getDefaultRoles();
    }  
}
