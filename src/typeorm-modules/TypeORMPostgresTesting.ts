import { TypeOrmModule } from "@nestjs/typeorm";

export const TypeORMPostgresTestingModule = (entities: any[]) =>
    TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localHost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'test',
          autoLoadEntities: true,
          synchronize: true,
        });