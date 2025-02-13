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

    // Roles
    @Get('roles')
    findAllRoles(): Promise<Role[]> {
        return this.authService.roles.findAll();
    }

    @Get('roles/:id')
    fineOneRole(@Param('id', ParseIntPipe) id: number): Promise<Role | null> {
        // handle if null
        return this.authService.roles.findOne({where: {id: id,},});
    }

    @Post()
    createRole(@Body() createRoleDto: CreateRoleDto){
        return this.authService.roles.create(createRoleDto);
    }

    @Patch('roles/:id')
    updateRole(@Param('id', ParseIntPipe) id: number, updateRoleDto: UpdateRoleDto){
        return this.authService.roles.update(id, updateRoleDto);
    }


    // Users
    
    @Get('users')
    findAllUsers(): Promise<User[]> {
        return this.authService.users.findAll();
    }

    @Get('users/:id')
    fineOneUser(@Param('id', ParseIntPipe) id: number): Promise<User | null> { 
        // handle if null
        return this.authService.users.findOne({where: {id: id,},});
    }

    @Post()
    createUser(@Body() createUserDto: CreateUserDto){
        return this.authService.users.create(createUserDto);
    }

    @Patch(':id')
    updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto){
        return this.authService.users.update(id, updateUserDto);
    }

    @Delete('users/:id')
    removeUser(@Param('id', ParseIntPipe) id: number){
        return this.authService.users.removeById(id);
    }

    // Authentication

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signInDto: SignInDto) {
        return this.authService.signIn(signInDto.username, signInDto.password)
    }
}
