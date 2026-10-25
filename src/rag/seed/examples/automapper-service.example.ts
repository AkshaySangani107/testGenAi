import { SeedDefinition } from '../types/seed-definition.type';

export const AUTOMAPPER_SERVICE_SEED_VERSION = 1;

export const automapperServiceSeed: SeedDefinition = {
  key: 'SEED_EXAMPLE_AUTOMAPPER_SERVICE',
  version: AUTOMAPPER_SERVICE_SEED_VERSION,
  title: 'Complete Service Spec — AutoMapper + Multiple Dependencies',
  category: 'SERVICE',
  language: 'typescript',
  contentType: 'EXAMPLE',
  tags: [
    'AutoMapper',
    'mapper',
    'getMapperToken',
    'map',
    'mapArray',
    'multiple-deps',
  ],
  content: `import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { getMapperToken } from '@automapper/nestjs'
import { NotFoundException } from '@nestjs/common'
import { PostService } from './post.service'
import { Post } from './post.entity'
import { PostResponseDto } from './dto/post-response.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { CategoryService } from '../category/category.service'

const mockPostRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
}

const mockMapper = {
    map: jest.fn().mockImplementation((val: unknown) => val),
    mapArray: jest.fn().mockImplementation((arr: unknown[]) => arr || []),
    mapArrayAsync: jest.fn().mockImplementation((arr: unknown[]) => Promise.resolve(arr || [])),
}

const mockCategoryService = {
    findOne: jest.fn(),
}

describe('PostService', () => {
    let service: PostService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                { provide: getRepositoryToken(Post), useValue: mockPostRepo },
                { provide: getMapperToken(), useValue: mockMapper },
                { provide: CategoryService, useValue: mockCategoryService },
            ],
        }).compile()

        service = module.get<PostService>(PostService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('findAll', () => {
        it('should return mapped array of PostResponseDto', async () => {
            const posts = [{ id: 1, title: 'Hello' }] as unknown as Post[]
            mockPostRepo.find.mockResolvedValue(posts)
            const mapped = [{ id: 1, title: 'Hello' }] as unknown as PostResponseDto[]
            mockMapper.mapArray.mockReturnValue(mapped)

            const result = await service.findAll()

            expect(mockMapper.mapArray).toHaveBeenCalledWith(posts, Post, PostResponseDto)
            expect(result).toEqual(mapped)
        })
    })

    describe('create', () => {
        it('should validate category exists and create post', async () => {
            const dto = { title: 'New Post', categoryId: 1 } as unknown as CreatePostDto
            const category = { id: 1 } as unknown
            mockCategoryService.findOne.mockResolvedValue(category)
            const post = { id: 1, ...dto } as unknown as Post
            mockPostRepo.create.mockReturnValue(post)
            mockPostRepo.save.mockResolvedValue(post)
            mockMapper.map.mockReturnValue({ id: 1 } as unknown as PostResponseDto)

            const result = await service.create(dto)

            expect(mockCategoryService.findOne).toHaveBeenCalledWith(dto.categoryId)
            expect(mockPostRepo.save).toHaveBeenCalledTimes(1)
            expect(result).toBeDefined()
        })

        it('should throw NotFoundException when category not found', async () => {
            mockCategoryService.findOne.mockResolvedValue(null)

            await expect(service.create({ categoryId: 99 } as unknown as CreatePostDto))
                .rejects.toThrow(NotFoundException)
        })
    })
})`,
};
