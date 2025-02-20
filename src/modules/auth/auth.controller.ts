import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './entities/role.entities';
import { User } from './entities/user.entities';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SignInDto } from './dto/sign-in.dto';
import { isQueryFailedError, isRole, isUser } from '../../util/type-checkers';
import { queryFailedBadRequest, unexpectedErrorInteralServerError } from './utils/db-http-exceptions';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('roles')
    async findAllRoles(): Promise<Role[]> {
        return await this.authService.roles.findAll();
    }

    @Get('roles/:id')
    async fineOneRole(@Param('id', ParseIntPipe) id: number): Promise<Role | null> {
        const result = await this.authService.roles.findOne({where: {id: id,} });
        if(!result){
            throw new NotFoundException('Role with id ${id} not found');
        }
        return result;
    }

    @Post('roles')
    async createRole(@Body() createRoleDto: CreateRoleDto){
        const result = await this.authService.createRole(createRoleDto);
        if(isRole(result)){
            return result;
        }
        else if(isQueryFailedError(result)){
            throw queryFailedBadRequest(result)
        }
        else{
            throw unexpectedErrorInteralServerError("Role to create already exists, or unexpected error.")
        }
    }

    @Patch('roles/:id')
    async updateRole(@Param('id', ParseIntPipe) id: number, updateRoleDto: UpdateRoleDto){
        const result = await this.authService.updateRole(id, updateRoleDto);
        if(isRole(result)){
            return result;
        }
        else if(isQueryFailedError(result)){
            throw queryFailedBadRequest(result);
        }
        else {
            throw unexpectedErrorInteralServerError(`role with id ${id} to update doesn't exist, or unexpected error`);
        }
    }

    @Delete('roles/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeRole(@Param('id', ParseIntPipe) id: number){
        const result = await this.authService.roles.removeById(id); 
        if(!result){
            throw new NotFoundException(`Role with id ${id} not found.`);
        }
    }

    @Get('users')
    async findAllUsers(): Promise<User[]> {
        return await this.authService.users.findAll();
    }

    @Get('users/:id')
    async findOneUser(@Param('id', ParseIntPipe) id: number): Promise<User | null> { 
        const result = await this.authService.users.findOne({where: {id: id,},});
        if(!result){
            throw new NotFoundException(`User with id ${id} not found.`);
        }
        return result;
    }

    @Post('users')
    async createUser(@Body() createUserDto: CreateUserDto){
        const result = await this.authService.createUser(createUserDto);
        if(isUser(result)){
            return result;
        }
        else if(isQueryFailedError(result)){
            throw queryFailedBadRequest(result);
        }
        else{
            throw unexpectedErrorInteralServerError("User to create already exists, or unexpected error");
        }
    }

    @Patch(':id')
    async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto){
        const result = await this.authService.updateUser(id, updateUserDto);
        if(isUser(result)){
            return result;
        }
        else if(isQueryFailedError(result)){
            throw queryFailedBadRequest(result);
        }
        else {
            throw unexpectedErrorInteralServerError(`User with id: ${id} to update doesn't exist, or unexpected error`);
        }
    }

    @Delete('users/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeUser(@Param('id', ParseIntPipe) id: number){
        const result = await this.authService.users.removeById(id);
        if(!result){
            throw new NotFoundException(`User with id ${id} not found.`);
        }
    }

    // Authentication
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() signInDto: SignInDto) {
        return await this.authService.signIn(signInDto.username, signInDto.password)
    }
}
