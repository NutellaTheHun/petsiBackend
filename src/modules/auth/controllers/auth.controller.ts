import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AppLogger } from '../../app-logging/app-logger';
import { Public } from '../../../util/decorators/PublicLogin';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SignInDto } from '../dto/sign-in.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly requestContextService: RequestContextService,
        private readonly logger: AppLogger,
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    @Public()  
    async signIn(@Body() signInDto: SignInDto) {
        return await this.authService.signIn(signInDto.username, signInDto.password)
    }
}