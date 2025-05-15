import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AppLogger } from '../../app-logging/app-logger';
import { Public } from '../../../util/decorators/PublicLogin';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SignInDto } from '../dto/sign-in.dto';
import { AuthService } from '../services/auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto } from '../dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly requestContextService: RequestContextService,
        private readonly logger: AppLogger,
    ) {}

    @ApiOperation({ summary: 'Sign in and receive a JWT token and user roles.' })
    @ApiResponse({ status: 200, description: 'Sign in successful.', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid username or password.' })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @Public()  
    async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
        const requestId = this.requestContextService.getRequestId();

        this.logger.logAction(
            'Authentication',
            requestId,
            'SIGN IN',
            'REQUEST',
            { requestId }
        );

        const result = await this.authService.signIn(signInDto.username, signInDto.password)

        this.logger.logAction(
            'Authentication',
            requestId,
            'SIGN IN',
            'SUCCESS',
            { requestId }
        );
        
        return result;
    }
}