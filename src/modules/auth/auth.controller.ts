import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './entities/role.entities';
import { User } from './entities/user.entities';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('roles')
    findAllRoles(): Promise<Role[]> {
        // handle if null
        return this.authService.roles.findAll();
    }

    @Get('roles/:id')
    fineOneRole(@Param('id', ParseIntPipe) id: number): Promise<Role | null> {
        // handle if null
        return this.authService.roles.findOne({where: {id: id,},});
    }

    @Post('roles')
    createRole(@Body() createRoleDto: CreateRoleDto){
        // validate: role doesn't already exist (will currently update if so save())
        return this.authService.createRole(createRoleDto);
    }

    @Patch('roles/:id')
    updateRole(@Param('id', ParseIntPipe) id: number, updateRoleDto: UpdateRoleDto){
        // if id not found? (currently using save() so will insert)
        return this.authService.updateRole(id, updateRoleDto);
    }

    @Delete('roles/:id')
    removeRole(@Param('id', ParseIntPipe) id: number){
        // handle if id not found
        return this.authService.roles.removeById(id);  //returns Promise<DeleteResult>
    }

    @Get('users')
    findAllUsers(): Promise<User[]> {
        // handle if null
        return this.authService.users.findAll();
    }

    @Get('users/:id')
    findOneUser(@Param('id', ParseIntPipe) id: number): Promise<User | null> { 
        // handle if null
        return this.authService.users.findOne({where: {id: id,},});
    }

    @Post('users')
    createUser(@Body() createUserDto: CreateUserDto){
        return this.authService.createUser(createUserDto);
    }

    @Patch(':id')
    updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto){
        // if id not found? (currently using save() so will insert)
        return this.authService.updateUser(id, updateUserDto);
    }

    @Delete('users/:id')
    removeUser(@Param('id', ParseIntPipe) id: number){
        // handle if id not found
        return this.authService.users.removeById(id); //returns Promise<DeleteResult>
    }

    // Authentication
    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signInDto: SignInDto) {
        //validate signInDto fields are populated?
        return this.authService.signIn(signInDto.username, signInDto.password)
    }
}
