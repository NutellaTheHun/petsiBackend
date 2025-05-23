import { NotFoundException } from "@nestjs/common";
import { FindOptionsWhere, In, ObjectLiteral, QueryBuilder, Repository } from "typeorm";
import { AppLogger } from "../modules/app-logging/app-logger";
import { RequestContextService } from "../modules/request-context/RequestContextService";
import { DatabaseError } from "../util/exceptions/database-error";
import { BuilderBase } from "./builder-base";
import { PaginatedResult } from "./paginated-result";

export abstract class ServiceBase<T extends ObjectLiteral> {

    constructor(
        private readonly entityRepo: Repository<T>,
        private readonly builder: BuilderBase<T>,
        public servicePrefix: string,
        private readonly requestContextService: RequestContextService,
        private logger: AppLogger,
    ) { }

    /**
     * @returns The created entity or throws AppHttpException from validation errors.
     */
    public async create(createDto: any): Promise<T> {
        const requestId = this.requestContextService.getRequestId();

        // create entity
        const entity = await this.builder.buildCreateDto(createDto);

        // save in DB
        try {
            return await this.entityRepo.save(entity);
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'CREATE',
                'FAIL',
                { requestId, databaseError: err }
            );
            throw DatabaseError.fromTypeOrmError(err);
        }
    }

    /**
     * @returns Updated entity or throws AppHttpException if validation fails, or NotFoundException if the supplied ID doesn't aquire an entity.
     */
    async update(id: number, updateDto: any): Promise<T> {
        const requestId = this.requestContextService.getRequestId();

        // retrieve entity from DB
        let toUpdate: T;
        try {
            toUpdate = await this.findOne(id);
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'UPDATE',
                'FAIL',
                { requestId, id, databaseError: err }
            );
            throw DatabaseError.fromTypeOrmError(err);
        }

        //update DTO
        await this.builder.buildUpdateDto(toUpdate, updateDto);

        //Save in DB
        try {
            return await this.entityRepo.save(toUpdate);
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'UPDATE',
                'FAIL',
                { requestId, id, databaseError: err }
            );
            throw DatabaseError.fromTypeOrmError(err);
        }

    }

    async findAll(options?: {
        relations?: string[];
        limit?: number;
        cursor?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<PaginatedResult<T>> {
        // Get requestId
        const requestId = this.requestContextService.getRequestId();

        // Set options with default settings
        options = {
            limit: 10,
            sortOrder: 'ASC',
            ...options,
        }

        // Start query with query builder
        const query = this.entityRepo.createQueryBuilder('entity');

        if (options.relations) {
            for (const relation of options.relations) {
                query.leftJoinAndSelect(`entity.${relation}`, relation as string);
            }
        }

        if (options.sortBy) {
            query.orderBy(`entity.${options.sortBy}`, options.sortOrder);
        } else {
            query.orderBy('entity.id', 'ASC');
        }

        if (options.limit) {
            query.limit(options.limit + 1);
        }

        if (options.cursor) {
            const operator = options?.sortOrder === 'DESC' ? '<' : '>';
            query.andWhere(`entity.${options.sortBy ?? 'id'} ${operator} :cursor`, { cursor: options.cursor });
        }

        // run query
        let results: T[] = [];
        try {
            results = await query.getMany();
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'FIND_ALL',
                'FAIL',
                { contextId: requestId, databaseError: err }
            );
            throw DatabaseError.fromTypeOrmError(err);
        }


        // handle cursor
        let nextCursor: string | undefined;
        if (options.limit) {
            if (results.length > options.limit) {
                const nextEntity = results.pop();
                nextCursor = (nextEntity as any)[options.sortBy ?? 'id'].toString();
            }
        }

        // log result
        this.logger.logAction(
            this.servicePrefix,
            requestId,
            'FIND_ALL',
            'REQUEST',
            { requestId, message: `${results.length} entities queried` }
        );

        // return result and cursor
        return {
            items: results,
            nextCursor,
        } as PaginatedResult<T>;
    }

    /**
     * @returns Entity or throws NotFoundException
     */
    async findOne(id: number, relations?: Array<keyof T>, childRelations?: string[]): Promise<T> {
        // Get requestId
        const requestId = this.requestContextService.getRequestId();

        const combinedRelations = [
            ...(relations?.map(r => r.toString()) ?? []),
            ...(childRelations ?? []),
        ];

        // run query and return
        let result;
        try {
            result = await this.entityRepo.findOne({
                where: { id } as unknown as FindOptionsWhere<T>,
                relations: combinedRelations,
            });
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'FIND_ONE',
                'FAIL',
                { contextId: requestId, id, databaseError: err }
            );

            throw DatabaseError.fromTypeOrmError(err);
        }

        if (!result) {
            this.logger.logAction(
                this.servicePrefix,
                requestId,
                'FIND_ONE',
                'REQUEST',
                { requestId, id, message: `no entity found with id: ${id}` }
            );
            throw new NotFoundException();
        }

        return result;
    }

    async findEntitiesById(ids: number[], relations?: Array<keyof T>): Promise<T[]> {
        // Get requestId
        const requestId = this.requestContextService.getRequestId();

        // run query and return
        const result = await this.entityRepo.find({
            where: { id: In(ids) } as unknown as FindOptionsWhere<T>,
            relations: relations as string[]
        });

        this.logger.logAction(
            this.servicePrefix,
            requestId,
            'FIND_ENTITIES_BY_ID',
            'REQUEST',
            { requestId, message: `${result.length} entities queried` }
        );

        return result
    }

    async remove(id: number): Promise<Boolean> {
        const requestId = this.requestContextService.getRequestId();
        try {
            return (await this.entityRepo.delete(id)).affected !== 0;
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'REMOVE',
                'FAIL',
                { contextId: requestId, id, databaseError: err }
            );

            throw DatabaseError.fromTypeOrmError(err);
        }

    }

    async insertEntity(entity: T): Promise<T | null> {
        return await this.entityRepo.save(entity);
    }

    async insertEntities(entities: T[]): Promise<T[] | null> {
        const results: T[] = [];
        for (const entity of entities) {
            results.push(
                await this.entityRepo.save(entity)
            );
        }
        return results;
    }

    getQueryBuilder(): QueryBuilder<T> {
        const requestId = this.requestContextService.getRequestId();
        try {
            return this.entityRepo.createQueryBuilder();
        } catch (err) {
            this.logger.logError(
                this.servicePrefix,
                requestId,
                'REMOVE',
                'FAIL',
                { contextId: requestId, databaseError: err }
            );

            throw DatabaseError.fromTypeOrmError(err);
        }

    }
}