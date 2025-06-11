import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UserService } from '../../users/services/user.service';
import { isPassHashMatch } from '../utils/hash';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configSerivce: ConfigService,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  async signIn(
    username: string,
    rawPass: string,
  ): Promise<{ access_token: string; roles: string[] }> {
    const requestId = this.requestContextService.getRequestId();

    const user = await this.userService.findOneByName(username, ['roles']);
    if (!user) {
      this.logger.logAction('Authentication', requestId, 'SIGN IN', 'FAIL', {
        requestId,
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!(await isPassHashMatch(rawPass, user.password))) {
      this.logger.logAction('Authentication', requestId, 'SIGN IN', 'FAIL', {
        requestId,
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles.map((role) => role.roleName),
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: '1hr',
      }),
      roles: user.roles.map((role) => role.roleName),
    };
  }

  getJwtSecret(): string | undefined {
    return this.configSerivce.get<string>('JWT_SECRET');
  }
}
