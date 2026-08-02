import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLocation } from '../../locations/entities/user-location.entity';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { User } from '../../users/entities/user.entities';
import { isPassHashMatch } from '../utils/hash';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserLocation)
    private readonly userLocationRepo: Repository<UserLocation>,
    private readonly jwtService: JwtService,
    private readonly configSerivce: ConfigService,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  async signIn(
    username: string,
    rawPass: string,
    tenantId: number,
  ): Promise<{ access_token: string; roles: string[] }> {
    const requestId = this.requestContextService.getRequestId();

    const user = await this.userRepo.findOne({
      where: { tenantId, name: username },
    });
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

    // Roles are held per-location via UserLocation; build the per-location
    // claim shape the JWT payload carries, plus a flattened list for the
    // response's frontend-rendering-only `roles` field.
    const assignments = await this.userLocationRepo.find({
      where: { user: { id: user.id } },
      relations: ['roles'],
    });
    const locations = assignments.map((assignment) => ({
      locationId: assignment.locationId,
      roles: assignment.roles.map((role) => role.name),
    }));
    const roleNames = [...new Set(locations.flatMap((l) => l.roles))];

    const payload = {
      sub: user.id,
      username: user.name,
      tenantId: user.tenantId,
      isTenantAdmin: user.isTenantAdmin,
      locations,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: '1hr',
      }),
      roles: roleNames,
    };
  }

  getJwtSecret(): string | undefined {
    return this.configSerivce.get<string>('JWT_SECRET');
  }
}
