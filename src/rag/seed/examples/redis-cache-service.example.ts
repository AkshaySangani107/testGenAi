import { SeedDefinition } from '../types/seed-definition.type'

export const REDIS_CACHE_SERVICE_SEED_VERSION = 1

export const redisCacheServiceSeed: SeedDefinition = {
    key: 'SEED_EXAMPLE_REDIS_CACHE_SERVICE',
    version: REDIS_CACHE_SERVICE_SEED_VERSION,
    title: 'Complete Service Spec — Redis Cache + Pagination',
    category: 'SERVICE',
    language: 'typescript',
    contentType: 'EXAMPLE',
    tags: ['redis', 'cache', 'CACHE_MANAGER', 'pagination', 'findAndCount', 'skip', 'take'],
    content: `import { Test, TestingModule } from '@nestjs/testing'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ProductService } from './product.service'
import { Product } from './product.entity'
import { PaginationDto } from './dto/pagination.dto'

const mockProductRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
}

const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
}

describe('ProductService', () => {
    let service: ProductService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService,
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile()

        service = module.get<ProductService>(ProductService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('findAll (paginated)', () => {
        it('should return cached result when cache hit', async () => {
            const cached = { items: [], total: 0 }
            mockCacheManager.get.mockResolvedValue(cached)
            const dto = { page: 1, limit: 10 } as unknown as PaginationDto

            const result = await service.findAll(dto)

            expect(result).toEqual(cached)
            expect(mockProductRepo.findAndCount).not.toHaveBeenCalled()
        })

        it('should query DB on cache miss and cache the result', async () => {
            mockCacheManager.get.mockResolvedValue(null)
            const products = [{ id: 1 }, { id: 2 }] as unknown as Product[]
            mockProductRepo.findAndCount.mockResolvedValue([products, 2])
            const dto = { page: 1, limit: 10 } as unknown as PaginationDto

            const result = await service.findAll(dto)

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
            })
            expect(mockCacheManager.set).toHaveBeenCalledTimes(1)
            expect(result).toEqual({ items: products, total: 2, page: 1, limit: 10 })
        })
    })

    describe('update', () => {
        it('should invalidate cache after update', async () => {
            const existing = { id: 1, name: 'Old' } as unknown as Product
            mockProductRepo.findOne.mockResolvedValue(existing)
            mockProductRepo.save.mockResolvedValue({ ...existing, name: 'New' })

            await service.update(1, { name: 'New' } as unknown as Partial<Product>)

            expect(mockCacheManager.del).toHaveBeenCalledWith('products:1')
        })
    })
})`,
}
