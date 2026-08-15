import { AppDataSource } from '../../data-source'
import { KnowledgeBase } from '../entities/knowledge-base.entity'

const knowledgeData = [

    // =========================
    // SERVICE TESTING
    // =========================
    {
        title: 'Testing Async Service Methods',
        category: 'SERVICE',
        tags: ['async', 'await', 'jest', 'mockResolvedValue'],
        content: `Test async NestJS service methods with async/await.
Always await expect() for async functions.
Use mockResolvedValue for successful async responses.
Use mockRejectedValue to simulate async failures.
Example: mockRepo.findOne.mockResolvedValue(null) simulates missing entity.`,
        language: 'typescript',
    },
    {
        title: 'Service Error Handling',
        category: 'SERVICE',
        tags: ['NotFoundException', 'errors', 'rejects', 'exceptions'],
        content: `Always test error cases in NestJS services.
If service throws NotFoundException write test verifying it throws when resource not found.
Use: await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
Verify dependent methods like save() are NOT called when validation fails.`,
        language: 'typescript',
    },
    {
        title: 'Service Dependency Injection Testing',
        category: 'SERVICE',
        tags: ['injection', 'providers', 'mock'],
        content: `Every injected dependency must be mocked in unit tests.
Use provide/useValue pattern in Test.createTestingModule providers array.
Retrieve service with module.get<ServiceName>(ServiceName).
Never instantiate service directly with new keyword in tests.`,
        language: 'typescript',
    },
    {
        title: 'Testing Service With Multiple Dependencies',
        category: 'SERVICE',
        tags: ['dependencies', 'mock', 'providers'],
        content: `When service has multiple dependencies mock each separately.
Create const mockUserRepo = { findOne: jest.fn(), save: jest.fn() }
Create const mockMailService = { send: jest.fn() }
Provide both in providers array using useValue.
Reset all mocks in afterEach(() => jest.clearAllMocks()).`,
        language: 'typescript',
    },
    {
        title: 'Testing Business Logic Branches',
        category: 'SERVICE',
        tags: ['branches', 'conditions', 'coverage'],
        content: `Test every if/else branch in service methods separately.
For each branch write separate it() test case.
Mock dependencies to return values that trigger each branch.
Verify different outcomes: different return values, different exceptions, different side effects.
Aim for 100% branch coverage on service layer.`,
        language: 'typescript',
    },

    // =========================
    // REPOSITORY TESTING
    // =========================
    {
        title: 'Mock TypeORM Repository',
        category: 'REPOSITORY',
        tags: ['typeorm', 'repository', 'mock', 'jest'],
        content: `Mock TypeORM repository methods in NestJS tests.
Mock findOne, save, delete, update, find, create using jest.fn().
Use mockResolvedValue for async methods, mockReturnValue for sync.
Use getRepositoryToken(Entity) to provide mock repository.
Example: { provide: getRepositoryToken(User), useValue: mockUserRepo }`,
        language: 'typescript',
    },
    {
        title: 'Repository Null Handling',
        category: 'REPOSITORY',
        tags: ['findOne', 'null', 'NotFoundException'],
        content: `Always check if findOne returns null before using result.
Throw NotFoundException when entity is not found.
Test: mockRepo.findOne.mockResolvedValue(null)
Then: await expect(service.findOne(1)).rejects.toThrow(NotFoundException)
Also test: findOne returns entity → service returns mapped result.`,
        language: 'typescript',
    },
    {
        title: 'Testing Repository Save Operations',
        category: 'REPOSITORY',
        tags: ['save', 'create', 'insert', 'typeorm'],
        content: `Test that save() is called with correct data.
Use mockRepo.save.mockResolvedValue(savedEntity).
After calling service method verify:
expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ email: dto.email }))
expect(mockRepo.save).toHaveBeenCalledTimes(1)
Test save failure: mockRepo.save.mockRejectedValue(new Error('DB error'))`,
        language: 'typescript',
    },
    {
        title: 'Testing Soft Delete Operations',
        category: 'REPOSITORY',
        tags: ['softDelete', 'delete', 'remove', 'typeorm'],
        content: `Test both hard delete and soft delete operations.
Mock deleteAsync or softDelete to return affected count.
Verify delete called with correct ID.
Test not-found case: mock returns affected=0 → verify NotFoundException thrown.
Example: mockRepo.delete.mockResolvedValue({ affected: 1 })`,
        language: 'typescript',
    },
    {
        title: 'Testing Repository Find With Relations',
        category: 'REPOSITORY',
        tags: ['relations', 'join', 'findOne', 'typeorm'],
        content: `When repository queries include relations mock the full returned object.
Include nested objects in mock data matching the relations structure.
Example: mockUser = { id:1, email:'test@test.com', profile: { id:1, bio:'test' } }
Verify getWithAsync or findOne called with correct relations array.`,
        language: 'typescript',
    },

    // =========================
    // CONTROLLER TESTING
    // =========================
    {
        title: 'Controller Unit Testing',
        category: 'CONTROLLER',
        tags: ['controller', 'http', 'jest'],
        content: `NestJS controllers should be tested independently from services.
Mock the service layer using jest.fn().
Verify controller calls correct service method with correct arguments.
Verify controller returns service result directly.
Do not test HTTP status codes in unit tests — use e2e for that.`,
        language: 'typescript',
    },
    {
        title: 'Testing Controller With Request Object',
        category: 'CONTROLLER',
        tags: ['request', 'payload', 'user', 'decorator'],
        content: `When controller uses @Req() or custom decorators mock the request object.
Create mockRequest = { user: { email: 'test@test.com', id: 1 } }
Pass directly to controller method in test.
Verify service called with extracted user data not full request object.`,
        language: 'typescript',
    },
    {
        title: 'Testing Controller Guards',
        category: 'CONTROLLER',
        tags: ['guards', 'auth', 'roles', 'decorator'],
        content: `Unit tests bypass guards by default — guards are tested separately.
To test guard behavior use e2e tests with real HTTP requests.
In unit tests focus on: does controller call correct service method.
Mock @GetUser() decorator by passing user directly as parameter.`,
        language: 'typescript',
    },

    // =========================
    // GUARD TESTING
    // =========================
    {
        title: 'NestJS Guard Unit Testing',
        category: 'GUARD',
        tags: ['guard', 'canActivate', 'ExecutionContext', 'auth'],
        content: `Mock ExecutionContext when testing Guards.
Create mock context: const mockContext = { switchToHttp: () => ({ getRequest: () => ({ user: mockUser }) }) }
Call guard.canActivate(mockContext as ExecutionContext).
Test authorized case: returns true when user has correct role.
Test unauthorized case: returns false or throws UnauthorizedException when user missing.`,
        language: 'typescript',
    },
    {
        title: 'JWT Guard Testing',
        category: 'GUARD',
        tags: ['jwt', 'guard', 'token', 'auth'],
        content: `Mock JwtService when testing JWT guards.
Test valid token: mockJwtService.verify.mockReturnValue({ userId: 1, email: 'test@test.com' })
Test expired token: mockJwtService.verify.mockImplementation(() => { throw new TokenExpiredError() })
Test missing token: request.headers.authorization = undefined → verify UnauthorizedException thrown.`,
        language: 'typescript',
    },
    {
        title: 'Roles Guard Testing',
        category: 'GUARD',
        tags: ['roles', 'guard', 'RBAC', 'permissions'],
        content: `Test role-based access control guards with different user roles.
Mock Reflector to return required roles: mockReflector.get.mockReturnValue(['admin'])
Test admin user: req.user.role = 'admin' → canActivate returns true.
Test regular user: req.user.role = 'user' → canActivate returns false.
Test no roles required: mockReflector.get.mockReturnValue(null) → returns true for all.`,
        language: 'typescript',
    },

    // =========================
    // INTERCEPTOR TESTING
    // =========================
    {
        title: 'NestJS Interceptor Testing',
        category: 'INTERCEPTOR',
        tags: ['interceptor', 'intercept', 'CallHandler', 'Observable'],
        content: `Mock ExecutionContext and CallHandler when testing interceptors.
Create mockCallHandler = { handle: jest.fn().mockReturnValue(of(responseData)) }
Call interceptor.intercept(mockContext, mockCallHandler).
Subscribe to returned Observable to get transformed result.
Verify transformation applied correctly to response data.`,
        language: 'typescript',
    },
    {
        title: 'Logging Interceptor Testing',
        category: 'INTERCEPTOR',
        tags: ['logging', 'interceptor', 'timing'],
        content: `Test logging interceptors verify they log before and after request.
Mock Logger methods: jest.spyOn(logger, 'log').mockImplementation(() => {})
Verify logger.log called twice: once before handler, once after.
Verify timing information included in log output.
Test error case: when handler throws verify error is still logged.`,
        language: 'typescript',
    },

    // =========================
    // PIPE TESTING
    // =========================
    {
        title: 'NestJS Pipe Unit Testing',
        category: 'PIPE',
        tags: ['pipe', 'transform', 'validation', 'ParseIntPipe'],
        content: `Test pipes by calling transform() method directly.
const pipe = new ParseIntPipe()
expect(pipe.transform('123', metadata)).resolves.toBe(123)
expect(pipe.transform('abc', metadata)).rejects.toThrow(BadRequestException)
Test custom pipes with various valid and invalid inputs.`,
        language: 'typescript',
    },
    {
        title: 'Validation Pipe Testing',
        category: 'PIPE',
        tags: ['ValidationPipe', 'class-validator', 'dto'],
        content: `Test custom validation pipes by providing valid and invalid DTOs.
Use class-transformer and class-validator to test DTO validation.
Valid input: pipe.transform(validDto, metadata) → returns transformed dto.
Invalid input: pipe.transform(invalidDto, metadata) → throws BadRequestException.
Verify error messages contain field names that failed validation.`,
        language: 'typescript',
    },

    // =========================
    // EVENT EMITTER TESTING
    // =========================
    {
        title: 'EventEmitter2 Testing in NestJS',
        category: 'EVENTS',
        tags: ['EventEmitter2', 'events', 'emit', 'listener'],
        content: `Mock EventEmitter2 when service emits events.
const mockEventEmitter = { emit: jest.fn(), on: jest.fn() }
Provide: { provide: EventEmitter2, useValue: mockEventEmitter }
After service action verify: expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.created', expect.objectContaining({ id: 1 }))
Test event listener handlers by calling handler method directly with mock payload.`,
        language: 'typescript',
    },
    {
        title: 'Testing OnEvent Listeners',
        category: 'EVENTS',
        tags: ['OnEvent', 'listener', 'handler', 'EventEmitter2'],
        content: `Test @OnEvent handlers by calling the handler method directly.
No need to emit actual events in unit tests.
Call: await service.handleUserCreated({ userId: 1, email: 'test@test.com' })
Verify: dependent services called with correct data.
Test error cases: handler throws → verify error logged or rethrown correctly.`,
        language: 'typescript',
    },

    // =========================
    // BULLMQ TESTING
    // =========================
    {
        title: 'BullMQ Queue Testing in NestJS',
        category: 'BULLMQ',
        tags: ['BullMQ', 'queue', 'job', 'add'],
        content: `Mock Queue when testing services that add jobs.
const mockQueue = { add: jest.fn().mockResolvedValue({ id: '1' }) }
Provide: { provide: getQueueToken('email'), useValue: mockQueue }
After service action verify: expect(mockQueue.add).toHaveBeenCalledWith('send-email', expect.objectContaining({ to: email }))
Verify job name and payload passed correctly.`,
        language: 'typescript',
    },
    {
        title: 'BullMQ Processor Testing',
        category: 'BULLMQ',
        tags: ['Processor', 'Process', 'job', 'worker'],
        content: `Test BullMQ processors by calling process() method directly with mock job.
Create mockJob = { id: '1', data: { userId: 1, email: 'test@test.com' }, attemptsMade: 0 }
Call: await processor.process(mockJob as Job)
Verify: dependent services called correctly.
Test failure case: service throws → verify error propagates so BullMQ can retry.`,
        language: 'typescript',
    },
    {
        title: 'BullMQ Job Retry Testing',
        category: 'BULLMQ',
        tags: ['retry', 'attempts', 'failed', 'BullMQ'],
        content: `Test job retry behavior by checking attemptsMade in mock job.
Mock job with different attemptsMade values to test retry logic.
mockJob.attemptsMade = 2 → verify final failure behavior.
mockJob.attemptsMade = 0 → verify first attempt behavior.
Test that failed jobs throw errors so BullMQ retry mechanism triggers.`,
        language: 'typescript',
    },

    // =========================
    // WEBSOCKET TESTING
    // =========================
    {
        title: 'WebSocket Gateway Unit Testing',
        category: 'WEBSOCKET',
        tags: ['Gateway', 'WebSocket', 'socket.io', 'emit'],
        content: `Mock Server and Socket when testing WebSocket gateways.
const mockServer = { emit: jest.fn(), to: jest.fn().mockReturnThis() }
const mockSocket = { id: 'socket-1', emit: jest.fn(), join: jest.fn() }
Call gateway.handleConnection(mockSocket as Socket).
Verify: mockSocket.join called with correct room.
Test message handlers by calling them directly with mock socket and payload.`,
        language: 'typescript',
    },
    {
        title: 'Testing WebSocket Events',
        category: 'WEBSOCKET',
        tags: ['events', 'emit', 'broadcast', 'room'],
        content: `Test gateway message handlers by calling handler methods directly.
Call: gateway.handleMessage(mockSocket, { room: 'room-1', message: 'hello' })
Verify: mockServer.to('room-1').emit called with correct event and data.
Test broadcast: verify server.emit called for global broadcasts.
Test private message: verify socket.emit called for direct messages.`,
        language: 'typescript',
    },

    // =========================
    // MICROSERVICE TESTING
    // =========================
    {
        title: 'NestJS Microservice Client Testing',
        category: 'MICROSERVICE',
        tags: ['ClientProxy', 'microservice', 'send', 'emit'],
        content: `Mock ClientProxy when testing microservice clients.
const mockClientProxy = { send: jest.fn(), emit: jest.fn() }
mockClientProxy.send.mockReturnValue(of({ success: true }))
Provide: { provide: 'USER_SERVICE', useValue: mockClientProxy }
Verify: expect(mockClientProxy.send).toHaveBeenCalledWith({ cmd: 'get_user' }, { id: 1 })`,
        language: 'typescript',
    },
    {
        title: 'Testing Message Patterns',
        category: 'MICROSERVICE',
        tags: ['MessagePattern', 'handler', 'RPC', 'microservice'],
        content: `Test @MessagePattern handlers by calling them directly.
No need to set up actual microservice transport in unit tests.
Call: const result = await controller.handleGetUser({ id: 1 })
Verify: service.findOne called with correct id.
Verify: returned data matches expected structure.
Test error: service throws → verify error propagates correctly.`,
        language: 'typescript',
    },
    {
        title: 'Testing Event Patterns in Microservices',
        category: 'MICROSERVICE',
        tags: ['EventPattern', 'async', 'fire-forget', 'microservice'],
        content: `Test @EventPattern handlers by calling handler method directly.
Event handlers are fire-and-forget so they return void.
Call: await controller.handleOrderCreated({ orderId: 1 })
Verify: correct service methods called with event payload.
Test idempotency: calling handler twice should not cause duplicate processing.`,
        language: 'typescript',
    },

    // =========================
    // REDIS / CACHE TESTING
    // =========================
    {
        title: 'Redis Cache Testing in NestJS',
        category: 'REDIS',
        tags: ['Redis', 'cache', 'CACHE_MANAGER', 'get', 'set'],
        content: `Mock CACHE_MANAGER when testing services that use Redis cache.
const mockCacheManager = { get: jest.fn(), set: jest.fn(), del: jest.fn() }
Provide: { provide: CACHE_MANAGER, useValue: mockCacheManager }
Test cache hit: mockCacheManager.get.mockResolvedValue(cachedData) → verify DB not called.
Test cache miss: mockCacheManager.get.mockResolvedValue(null) → verify DB called and result cached.`,
        language: 'typescript',
    },
    {
        title: 'Testing Cache Invalidation',
        category: 'REDIS',
        tags: ['cache', 'invalidation', 'del', 'Redis'],
        content: `Test cache invalidation after update or delete operations.
After service.update() verify: expect(mockCacheManager.del).toHaveBeenCalledWith('user:1')
After service.delete() verify: cache key deleted.
Test cache TTL: verify mockCacheManager.set called with correct TTL value.
Example: expect(mockCacheManager.set).toHaveBeenCalledWith('key', data, { ttl: 3600 })`,
        language: 'typescript',
    },

    // =========================
    // RABBITMQ TESTING
    // =========================
    {
        title: 'RabbitMQ Publisher Testing',
        category: 'RABBITMQ',
        tags: ['RabbitMQ', 'publish', 'amqp', 'message'],
        content: `Mock RabbitMQ client when testing services that publish messages.
const mockRabbitClient = { publish: jest.fn(), emit: jest.fn() }
After service action verify message published to correct exchange and routing key.
Test publish failure: mockRabbitClient.publish.mockRejectedValue(new Error('Connection failed'))
Verify service handles publish failure gracefully.`,
        language: 'typescript',
    },
    {
        title: 'RabbitMQ Consumer Testing',
        category: 'RABBITMQ',
        tags: ['RabbitMQ', 'consumer', 'subscribe', 'handler'],
        content: `Test RabbitMQ message handlers by calling them directly with mock message.
Create mock message: { content: Buffer.from(JSON.stringify(payload)), fields: {}, properties: {} }
Call handler directly: await service.handlePaymentEvent(payload)
Verify: downstream services called correctly.
Test acknowledgement: verify message ack called on success, nack on failure.`,
        language: 'typescript',
    },

    // =========================
    // VALIDATION TESTING
    // =========================
    {
        title: 'DTO Validation Testing',
        category: 'VALIDATION',
        tags: ['class-validator', 'dto', 'validation', 'BadRequestException'],
        content: `Use class-validator decorators like @IsEmail() @IsNotEmpty() @MinLength().
Test invalid payloads verify BadRequestException returned.
Use validate() from class-validator to test DTO validation directly.
const errors = await validate(plainToClass(CreateUserDto, invalidPayload))
expect(errors.length).toBeGreaterThan(0)`,
        language: 'typescript',
    },
    {
        title: 'Custom Validator Testing',
        category: 'VALIDATION',
        tags: ['custom-validator', 'ValidatorConstraint', 'validation'],
        content: `Test custom validators by calling validate() method directly.
const validator = new IsUniqueEmailConstraint(mockUserRepo)
Test valid case: mockUserRepo.findOne.mockResolvedValue(null) → validate returns true.
Test invalid case: mockUserRepo.findOne.mockResolvedValue(existingUser) → validate returns false.
Verify defaultMessage() returns human-readable error message.`,
        language: 'typescript',
    },

    // =========================
    // JWT / AUTH TESTING
    // =========================
    {
        title: 'JWT Authentication Testing',
        category: 'AUTH',
        tags: ['jwt', 'authentication', 'JwtService', 'token'],
        content: `Mock JwtService when testing auth services.
const mockJwtService = { sign: jest.fn().mockReturnValue('mock.jwt.token'), verify: jest.fn() }
Test login success: verify sign called with correct payload.
Test token verification: mockJwtService.verify.mockReturnValue({ userId: 1 })
Test expired token: mockJwtService.verify.mockImplementation(() => { throw new Error('jwt expired') })`,
        language: 'typescript',
    },
    {
        title: 'Resource Ownership Testing',
        category: 'AUTH',
        tags: ['authorization', 'ownership', 'ForbiddenException'],
        content: `Test that users cannot modify resources they do not own.
Mock request user: payload = { user: { id: 2 } }
Mock resource owner: mockRepo.findOne returns { authorId: 1 }
Verify service throws ForbiddenException when IDs don't match.
Test admin bypass: payload.user.role = 'admin' → operation succeeds regardless of ownership.`,
        language: 'typescript',
    },
    {
        title: 'Password Hashing Testing',
        category: 'AUTH',
        tags: ['bcrypt', 'password', 'hash', 'compare'],
        content: `Verify passwords are hashed before saving.
After service.register(dto) check: saved password !== original password.
Use bcrypt.compare to verify hash is valid: const isValid = await bcrypt.compare(originalPassword, savedPassword)
expect(isValid).toBe(true)
Test login: mock bcrypt.compare or verify it called with correct arguments.`,
        language: 'typescript',
    },

    // =========================
    // DATABASE TESTING
    // =========================
    {
        title: 'Database Transaction Testing',
        category: 'DATABASE',
        tags: ['transaction', 'rollback', 'queryRunner', 'typeorm'],
        content: `Mock QueryRunner when testing transactional operations.
const mockQueryRunner = { connect: jest.fn(), startTransaction: jest.fn(), commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn(), manager: { save: jest.fn() } }
Test success: verify commitTransaction called.
Test failure: service throws → verify rollbackTransaction called, commitTransaction NOT called.`,
        language: 'typescript',
    },
    {
        title: 'Testing Pagination Queries',
        category: 'DATABASE',
        tags: ['pagination', 'findAndCount', 'skip', 'take'],
        content: `Mock findAndCount when testing pagination.
mockRepo.findAndCount.mockResolvedValue([[item1, item2], 10])
Verify findAndCount called with correct skip and take values.
skip = (page - 1) * limit
take = limit
Verify returned object has items, total, page, limit properties.
Test empty page: mockResolvedValue([[], 0]) → verify empty items returned.`,
        language: 'typescript',
    },

    // =========================
    // MAIL TESTING
    // =========================
    {
        title: 'Mail Service Testing',
        category: 'MAIL',
        tags: ['mail', 'email', 'nodemailer', 'send'],
        content: `Mock MailService when testing services that send emails.
const mockMailService = { send: jest.fn().mockResolvedValue(undefined) }
After service action verify: expect(mockMailService.send).toHaveBeenCalledWith(expect.objectContaining({ to: userEmail, subject: 'Welcome' }))
Test mail failure: mockMailService.send.mockRejectedValue(new Error('SMTP error'))
Verify service handles mail failure gracefully without crashing.`,
        language: 'typescript',
    },
    {
        title: 'Testing Password Reset Email',
        category: 'MAIL',
        tags: ['password-reset', 'email', 'token', 'mail'],
        content: `Test password reset flow: service generates token and sends email.
Mock JwtService.sign to return predictable token.
Verify MailService.send called with reset link containing token.
Verify reset link contains correct frontend URL from config.
Test invalid email: mockRepo.allAsync returns [] → verify NotFoundErr thrown, email NOT sent.`,
        language: 'typescript',
    },

    // =========================
    // EDGE CASES
    // =========================
    {
        title: 'Boundary Value Testing',
        category: 'EDGE_CASE',
        tags: ['boundary', 'null', 'undefined', 'empty'],
        content: `Test empty strings, null values, undefined values and maximum input lengths.
Test string with only whitespace characters.
Test numbers: 0, -1, Number.MAX_SAFE_INTEGER, NaN.
Test arrays: empty [], single item, maximum items.
Verify services handle all invalid inputs gracefully with appropriate errors.`,
        language: 'typescript',
    },
    {
        title: 'Pagination Edge Cases',
        category: 'EDGE_CASE',
        tags: ['pagination', 'limit', 'page', 'boundary'],
        content: `Test page 0 and negative page numbers → verify defaults applied or error thrown.
Test limit exceeding maximum allowed → verify capped at maximum.
Test empty result sets → verify empty array returned not NotFoundException.
Test page beyond total pages → verify empty array returned gracefully.`,
        language: 'typescript',
    },
    {
        title: 'Concurrent Request Testing',
        category: 'EDGE_CASE',
        tags: ['concurrent', 'race-condition', 'Promise.all'],
        content: `Test concurrent calls to same service method.
Use Promise.all to simulate concurrent requests.
const results = await Promise.all([service.create(dto), service.create(dto)])
Verify no duplicate data created.
Test optimistic locking: second update fails when first already updated record.`,
        language: 'typescript',
    },
    {
        title: 'Large Payload Testing',
        category: 'EDGE_CASE',
        tags: ['payload', 'large', 'performance', 'limit'],
        content: `Test service behavior with very large inputs.
Test string fields at maximum allowed length.
Test arrays with maximum number of items.
Verify service rejects payloads exceeding limits with BadRequestException.
Test file upload size limits if applicable.`,
        language: 'typescript',
    },

    // =========================
    // GENERAL TESTING
    // =========================
    {
        title: 'NestJS Testing Module Setup',
        category: 'TESTING',
        tags: ['TestingModule', 'jest', 'unit-test', 'beforeEach'],
        content: `NestJS unit tests should mock all dependencies using jest.fn().
Never connect to real database during unit testing.
Use Test.createTestingModule() to create isolated testing modules.
Always call jest.clearAllMocks() in afterEach.
Use beforeEach to create fresh module instance for each test.`,
        language: 'typescript',
    },
    {
        title: 'Mock Factory Pattern',
        category: 'TESTING',
        tags: ['mock', 'factory', 'jest', 'reusable'],
        content: `Create reusable mock factories for common entities.
const createMockUser = (overrides = {}) => ({ id: 1, email: 'test@test.com', name: 'Test', ...overrides })
Use in tests: const mockUser = createMockUser({ email: 'custom@test.com' })
This keeps tests DRY and makes test data creation consistent.
Create factory for each main entity in your application.`,
        language: 'typescript',
    },
    {
        title: 'Spy vs Mock in Jest',
        category: 'TESTING',
        tags: ['spy', 'mock', 'spyOn', 'jest'],
        content: `Use jest.fn() for complete mock replacement of functions.
Use jest.spyOn() to wrap real implementation and optionally override.
spyOn preserves original behavior unless you call mockImplementation.
Restore spies in afterEach: jest.restoreAllMocks()
Use spyOn for: partial mocking, verifying calls on real objects.`,
        language: 'typescript',
    },
    {
        title: 'Testing With Real Dates and Times',
        category: 'TESTING',
        tags: ['date', 'time', 'timer', 'fake', 'jest'],
        content: `Mock Date.now() for consistent time-based tests.
jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01').getTime())
Use jest.useFakeTimers() when testing setTimeout or setInterval.
jest.advanceTimersByTime(5000) to simulate time passing.
Always restore real timers: afterEach(() => jest.useRealTimers())`,
        language: 'typescript',
    },
    {
        title: 'Snapshot Testing in NestJS',
        category: 'TESTING',
        tags: ['snapshot', 'toMatchSnapshot', 'jest'],
        content: `Use snapshot tests for complex return objects that should not change.
expect(result).toMatchSnapshot()
Run jest --updateSnapshot to update snapshots when intentional changes made.
Use for: API response shapes, transformed DTOs, complex mapped objects.
Avoid for: objects with timestamps or random values that change each run.`,
        language: 'typescript',
    },
]
async function seed() {
    await AppDataSource.initialize()
    console.log('DB connected')

    const repo = AppDataSource.getRepository(KnowledgeBase)

    // Clear existing data
    await repo.clear()
    console.log('Cleared existing knowledge base')

    // Insert seed data (without embeddings for now)
    for (const item of knowledgeData) {
        const knowledge = repo.create(item)
        await repo.save(knowledge)
        console.log(`Seeded: ${item.category} — ${item.content.slice(0, 50)}...`)
    }

    console.log(`✅ Seeded ${knowledgeData.length} knowledge items`)
    await AppDataSource.destroy()
}

seed().catch(console.error)