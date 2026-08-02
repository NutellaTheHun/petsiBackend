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
  ): Promise<{ access_token: string; roles: string[] }> {
    const requestId = this.requestContextService.getRequestId();

    const user = await this.userRepo.findOne({
      where: { name: username },
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

    // Roles are held per-location via UserLocation; flatten every location
    // assignment's roles into the flat list the JWT payload still expects.
    // Location-aware claims (tenantId, isTenantAdmin, per-location roles)
    // are wired up in a later slice.
    const assignments = await this.userLocationRepo.find({
      where: { user: { id: user.id } },
      relations: ['roles'],
    });
    const roleNames = [
      ...new Set(assignments.flatMap((a) => a.roles.map((role) => role.name))),
    ];

    const payload = {
      sub: user.id,
      username: user.name,
      roles: roleNames,
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
