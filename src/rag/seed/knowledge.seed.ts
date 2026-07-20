import { AppDataSource } from '../../data-source'
import { KnowledgeBase } from '../entities/knowledge-base.entity'

const knowledgeData = [
    // =========================
    // SERVICE
    // =========================
    {
        title: 'Testing Async Service Methods',
        category: 'SERVICE',
        tags: ['async', 'await', 'jest', 'mockResolvedValue'],
        content: `Test async NestJS service methods with async/await.
Always await expect() for async functions.
Use mockResolvedValue for successful async responses.
Use mockRejectedValue to simulate async failures.`,
        language: 'typescript',
    },
    {
        title: 'Service Error Handling',
        category: 'SERVICE',
        tags: ['NotFoundException', 'errors', 'rejects', 'exceptions'],
        content: `Always test error cases in NestJS services.
If a service throws NotFoundException, write a test that verifies it throws when the resource is not found.
Use rejects.toThrow() for async error testing.`,
        language: 'typescript',
    },

    // =========================
    // REPOSITORY
    // =========================
    {
        title: 'Mock TypeORM Repository',
        category: 'REPOSITORY',
        tags: ['typeorm', 'repository', 'mock', 'jest'],
        content: `Mock TypeORM repository methods in NestJS tests.
Mock findOne, save, delete, update using jest.fn().
Use mockResolvedValue for async methods.
Use getRepositoryToken(Entity) to provide mock repository.`,
        language: 'typescript',
    },
    {
        title: 'Repository Null Handling',
        category: 'REPOSITORY',
        tags: ['findOne', 'null', 'NotFoundException'],
        content: `Always check if findOne returns null.
Throw NotFoundException when entity is not found.
Test this by mocking findOne to return null.`,
        language: 'typescript',
    },

    // =========================
    // CONTROLLER
    // =========================
    {
        title: 'Controller Unit Testing',
        category: 'CONTROLLER',
        tags: ['controller', 'http', 'jest'],
        content: `NestJS controllers should be tested independently from services.
Mock the service layer using jest.fn().
Verify status codes and returned DTOs.`,
        language: 'typescript',

    },

    // =========================
    // VALIDATION
    // =========================
    {
        title: 'DTO Validation',
        category: 'VALIDATION',
        tags: ['class-validator', 'dto', 'validation'],
        content: `Use class-validator decorators like @IsEmail(), @IsNotEmpty(), and @MinLength().
Test invalid payloads and verify BadRequestException is returned.`,
        language: 'typescript',
    },

    // =========================
    // AUTH
    // =========================
    {
        title: 'JWT Authentication',
        category: 'AUTH',
        tags: ['jwt', 'authentication', 'guards'],
        content: `Test expired JWT tokens.
Test invalid JWT tokens.
Test missing Authorization header.
Verify UnauthorizedException is thrown.`,
        language: 'typescript',
    },
    {
        title: 'Resource Ownership',
        category: 'AUTH',
        tags: ['authorization', 'ownership', 'ForbiddenException'],
        content: `Verify users cannot modify resources they do not own.
Throw ForbiddenException when ownership validation fails.`,
        language: 'typescript',
    },

    // =========================
    // DATABASE
    // =========================
    {
        title: 'Database Transactions',
        category: 'DATABASE',
        tags: ['transaction', 'rollback', 'typeorm'],
        content: `Verify transactional operations rollback correctly when failures occur.
Mock transaction manager for unit tests.`,
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
Verify services handle invalid inputs gracefully.`,
        language: 'typescript',
    },
    {
        title: 'Pagination Edge Cases',
        category: 'EDGE_CASE',
        tags: ['pagination', 'limit', 'page'],
        content: `Test page 0, negative page numbers, oversized limits and empty result sets.`,
        language: 'typescript',
    },

    // =========================
    // GENERAL TESTING
    // =========================
    {
        title: 'NestJS Testing Module',
        category: 'TESTING',
        tags: ['TestingModule', 'jest', 'unit-test'],
        content: `NestJS unit tests should mock all dependencies using jest.fn().
Never connect to a real database during unit testing.
Use Test.createTestingModule() to create isolated testing modules.`,
        language: 'typescript',
    },
];
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