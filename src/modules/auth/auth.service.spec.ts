import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TypeORMPostgresTestingModule } from 'src/typeorm-configs/TypeORMPostgresTesting';
import { User } from './entities/user.entities';
import { Role } from './entities/role.entities';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeORMPostgresTestingModule([User, Role]),
        TypeOrmModule.forFeature([User, Role]),
      ],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
