import { CreateUserDto, CreateUserDtoDefaultValues } from "../dto/create-user.dto";
import { hashPassword } from "../../auth/utils/hash";
import { User } from "./user.entities";
import { UpdateUserDto } from "../dto/update-user.dto";
import { EntityFactory } from "../../../base/entity-factory";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserFactory extends EntityFactory<User, CreateUserDto, UpdateUserDto>{
    constructor(){
        super(User, CreateUserDto, UpdateUserDto, CreateUserDtoDefaultValues());
    }

    async defaultUsers() : Promise<User[]> {
        const pHash = await hashPassword("test");
        // figure out nice way of getting roles.
        const roles = []
        return [
            this.createEntityInstance({username: "admin", rawPassword: "test"})
        ];
    }
    
    async getTestUsers() : Promise<User[]> {
        return await this.defaultUsers();
    }
}



