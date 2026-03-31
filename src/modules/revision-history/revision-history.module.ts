import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionHistory } from './entities/revision-history.entity';
import { RevisionHistoryService } from './revision-history.service';
import { RevisionHistoryPrunerService } from './services/revision-history-pruner.service';
import { RevisionHistoryRetentionPolicyService } from './services/revision-history-retention-policy.service';

@Module({
    imports: [TypeOrmModule.forFeature([RevisionHistory])],
    providers: [
        RevisionHistoryService,
        RevisionHistoryRetentionPolicyService,
        RevisionHistoryPrunerService,
    ],
    exports: [RevisionHistoryService, TypeOrmModule],
})
export class RevisionHistoryModule {}
