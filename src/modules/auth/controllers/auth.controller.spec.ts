import { UnauthorizedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { User } from '../../users/entities/user.entities';
import { USER_A, USER_B, USER_C, USER_D } from '../../users/utils/constants';
import { SignInDto } from '../dto/sign-in.dto';
import { AuthService } from '../services/auth.service';
import { getAuthTestingModule } from '../utils/auth-testing-module';
import { hashPassword, isPassHashMatch } from '../utils/hash';
import { AuthController } from './auth.controller';


describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    beforeAll(async () => {
        const module: TestingModule = await getAuthTestingModule();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        let users = [
            { username: USER_A, password: await hashPassword("passA"), email: "email_A@email.com" } as User,
            { username: USER_B, password: await hashPassword("passB"), email: "email_B@email.com" } as User,
            { username: USER_C, password: await hashPassword("passC"), email: "email_C@email.com" } as User,
            { username: USER_D, password: await hashPassword("passD"), email: "email_D@email.com" } as User,
        ];

        jest.spyOn(authService, "signIn").mockImplementation(async (username, inputPass) => {
            const user = users.find(user => user.username === username);
            if (!user || !(await isPassHashMatch(inputPass, user.password))) throw new UnauthorizedException();
            return { access_token: 'mock_token', roles: ["role"] };
        });
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it("should sign in", async () => {
        const username = 'user_A'
        const pass = 'passA'
        const result = await controller.signIn({ username: username, password: pass } as SignInDto);
        expect(result.access_token).toEqual('mock_token');
    });

    it("should fail to sign in (username doesnt exist)", async () => {
        const username = 'userE'
        const pass = 'passA'
        await expect(controller.signIn({ username: username, password: pass } as SignInDto)).rejects.toThrow(UnauthorizedException);
    });

    it("should fail to sign in (wrong password)", async () => {
        const username = 'userA'
        const pass = 'passB'
        await expect(controller.signIn({ username: username, password: pass } as SignInDto)).rejects.toThrow(UnauthorizedException);
    });
});
