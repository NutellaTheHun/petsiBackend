import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../../common/decorators/PublicLogin';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'Sign in and receive a JWT token and user roles.' })
  @ApiOkResponse({ description: 'Sign in successful.', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    // Resolved by TenantResolutionMiddleware before this handler runs,
    // for every route including this @Public() one.
    const tenantId = req['tenant']?.id;

    const result = await this.authService.signIn(
      signInDto.username,
      signInDto.password,
      tenantId,
    );

    return result;
  }
}
