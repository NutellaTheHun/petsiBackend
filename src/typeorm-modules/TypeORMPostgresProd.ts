import { TypeOrmModule } from "@nestjs/typeorm";

export const TypeORMPostgresModule = (entities: any[]) =>
    TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localHost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'prod',
          autoLoadEntities: true,
          synchronize: false,
        });