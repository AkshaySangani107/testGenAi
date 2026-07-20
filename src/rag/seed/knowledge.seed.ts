import { AppDataSource } from '../../data-source'
import { KnowledgeBase } from '../entities/knowledge-base.entity'

const knowledgeData = [
    // Testing patterns
    {
        content: `NestJS unit tests should mock all dependencies using jest.fn(). 
    Never use real database connections in unit tests.
    Use Test.createTestingModule() to create isolated test modules.`,
        category: 'testing-pattern',
        language: 'typescript',
    },
    {
        content: `Always test error cases in NestJS services. 
    If a service throws NotFoundException, write a test that 
    verifies it throws when the resource is not found.
    Use rejects.toThrow() for async error testing.`,
        category: 'testing-pattern',
        language: 'typescript',
    },
    {
        content: `Mock TypeORM repository methods in NestJS tests.
    Mock findOne, save, delete, update using jest.fn().
    Use mockResolvedValue for async methods.
    Use getRepositoryToken(Entity) to provide mock repository.`,
        category: 'testing-pattern',
        language: 'typescript',
    },
    {
        content: `Test async NestJS service methods with async/await.
    Always await expect() for async functions.
    Use mockResolvedValue for successful async responses.
    Use mockRejectedValue to simulate async failures.`,
        category: 'testing-pattern',
        language: 'typescript',
    },

    // Common bugs
    {
        content: `Common NestJS bug: Not handling null from findOne.
    Always check if result is null before using it.
    Throw NotFoundException when entity is not found.
    Test: mock findOne to return null and verify NotFoundException thrown.`,
        category: 'bug-pattern',
        language: 'typescript',
    },
    {
        content: `Common bug: Password stored as plain text.
    Always hash passwords with bcrypt before saving.
    Never store or return plain text passwords in responses.
    Test: verify password in DB is different from input password.`,
        category: 'bug-pattern',
        language: 'typescript',
    },
    {
        content: `Common bug: Missing validation on DTOs.
    Use class-validator: @IsEmail(), @IsNotEmpty(), @MinLength().
    Test: send invalid data and verify 400 BadRequest thrown.
    Test: send empty fields and verify validation error.`,
        category: 'bug-pattern',
        language: 'typescript',
    },
    {
        content: `Common bug: Race condition on concurrent requests.
    Test concurrent calls to the same endpoint.
    Verify data integrity when multiple requests hit simultaneously.
    Use Promise.all() in tests to simulate concurrency.`,
        category: 'bug-pattern',
        language: 'typescript',
    },

    // Security patterns
    {
        content: `Security test: Verify user ownership before update/delete.
    Test that user A cannot update/delete user B's resources.
    Throw ForbiddenException if requesting user doesn't own resource.
    Mock auth context to test different user scenarios.`,
        category: 'security-pattern',
        language: 'typescript',
    },
    {
        content: `Security test: JWT token validation.
    Test expired tokens are rejected.
    Test invalid tokens throw UnauthorizedException.
    Test missing tokens are rejected with 401.`,
        category: 'security-pattern',
        language: 'typescript',
    },

    // Edge cases
    {
        content: `Edge case testing for NestJS services.
    Test with empty strings, null values, undefined inputs.
    Test with maximum length inputs to check overflow.
    Test with special characters in string fields.`,
        category: 'edge-case',
        language: 'typescript',
    },
    {
        content: `Edge case: Test pagination boundary conditions.
    Test page 0 or negative page numbers.
    Test limit exceeding maximum allowed value.
    Test empty result sets with pagination.`,
        category: 'edge-case',
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