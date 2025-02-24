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
            this.createEntityInstance({username: "admin", password: "test"})
        ];
    }
    
    /**
     * 
     * @returns Returns 4 users { "userA-D" "passA-D", email:...}
     */
    async getTestUsers() : Promise<User[]> {
        let users = [
            await this.createEntityInstance({ username: "userA", password: "passA", email: "emailA" }),
            await this.createEntityInstance({ username: "userB", password: "passB", email: "emailB" }),
            await this.createEntityInstance({ username: "userC", password: "passC", email: "emailC" }),
            await this.createEntityInstance({ username: "userD", password: "passD", email: "emailD" })
          ];
          users[0].id = 1;
          users[1].id = 2;
          users[2].id = 3;
          users[3].id = 4;
        return users;
    }
}



