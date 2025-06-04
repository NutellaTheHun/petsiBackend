import { TypeORMPostgresModule } from "./configs/TypeORMPostgresProd";
import { TypeORMPostgresTestingModule } from "./configs/TypeORMPostgresTesting";

export function selectTypeOrmModule(entities: any[] = []) {
    const env = process.env.NODE_ENV;
    if (env === 'production') {
        return TypeORMPostgresModule(entities);
    } else {
        return TypeORMPostgresTestingModule(entities);
    }
}