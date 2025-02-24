import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { isPassHashMatch } from './utils/hash';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';


@Injectable()
export class AuthService {
    constructor(
        //@Inject(forwardRef(() => RolesService))
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configSerivce: ConfigService,
    ){}

    async signIn(username: string, pass: string): Promise<{ access_token: string }> {
        const user = await this.userService.findOneByName(username);
        if(!user){ throw new UnauthorizedException('Invalid username or password'); }// check if this wil suffice
        
        if (!(await isPassHashMatch(pass, user.passwordHash))){
            throw new UnauthorizedException('Invalid username or password');
        }

        const payload = { sub: user.id, username: user.username}

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    // signout ????
    async signOut(){

    }

    getJwtSecret(): string | undefined { 
        return this.configSerivce.get<string>('JWT_SECRET');
    }
}