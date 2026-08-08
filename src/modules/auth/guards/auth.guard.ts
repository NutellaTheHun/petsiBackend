import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/PublicLogin';
import { getRequestNamespace } from '../../request-context/RequestContextService';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.authService.getJwtSecret(),
      });
      request['user'] = payload;
      const ns = getRequestNamespace();
      if (ns?.active && payload?.sub != null) {
        const userId = Number(payload.sub);
        if (Number.isFinite(userId)) {
          ns.set('userId', userId);
        }
        if (payload?.tenantId != null) {
          const tenantId = Number(payload.tenantId);
          if (Number.isFinite(tenantId)) {
            ns.set('tenantId', tenantId);
          }
        }
        if (typeof payload?.isTenantAdmin === 'boolean') {
          ns.set('isTenantAdmin', payload.isTenantAdmin);
        }
        if (Array.isArray(payload?.locations)) {
          ns.set('locations', payload.locations);
        }
      }
    } catch (err) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type == 'Bearer' ? token : undefined;
  }
}
