
/**
 * All recurring order schedule entites interactions are through the order entity, so its tests are handled in the order service spec.
 */

/*
describe('RecurringOrderScheduleService', () => {

    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    let service: RecurringOrderScheduleService;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;

    let menuItemRepo: Repository<MenuItem>;


    const getMenuItemTypeSingle = async (): Promise<MenuItem> => {
        return await menuItemRepo.findOneOrFail({ where: { type: MENU_ITEM_TYPES.SINGLE }, relations: ['sizes'] });
    }

    const getCategory = async (): Promise<OrderCategory> => {
        return await categoryRepo.findOneOrFail({ where: {} });
    }

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        dataSource = module.get(DataSource);

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        service = module.get<RecurringOrderScheduleService>(RecurringOrderScheduleService);

        orderRepo = module.get(getRepositoryToken(Order));
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });



    it('should create a recurring order schedule', async () => {

    });

    it('should update a recurring order schedule', async () => {

    });

    it('should delete a recurring order schedule', async () => {

    });
});*/