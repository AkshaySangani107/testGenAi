import { SeedDefinition } from '../types/seed-definition.type';

export const CRUD_SERVICE_SEED_VERSION = 1;

export const crudServiceSeed: SeedDefinition = {
  key: 'SEED_EXAMPLE_CRUD_SERVICE',
  version: CRUD_SERVICE_SEED_VERSION,
  title: 'Complete CRUD Service Spec — TypeORM Repository',
  category: 'SERVICE',
  language: 'typescript',
  contentType: 'EXAMPLE',
  tags: [
    'crud',
    'typeorm',
    'repository',
    'NotFoundException',
    'save',
    'findOne',
  ],
  content: `import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException } from '@nestjs/common'
import { UserService } from './user.service'
import { User } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

const mockUserRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
}

describe('UserService', () => {
    let service: UserService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
            ],
        }).compile()

        service = module.get<UserService>(UserService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('findOne', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 1, email: 'test@test.com' } as unknown as User
            mockUserRepo.findOne.mockResolvedValue(mockUser)

            const result = await service.findOne(1)

            expect(result).toEqual(mockUser)
            expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
        })

        it('should throw NotFoundException when user not found', async () => {
            mockUserRepo.findOne.mockResolvedValue(null)

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
        })
    })

    describe('create', () => {
        it('should create and return new user', async () => {
            const dto = {} as unknown as CreateUserDto
            const createdUser = { id: 1, ...dto } as unknown as User
            mockUserRepo.create.mockReturnValue(createdUser)
            mockUserRepo.save.mockResolvedValue(createdUser)

            const result = await service.create(dto)

            expect(result).toEqual(createdUser)
            expect(mockUserRepo.save).toHaveBeenCalledTimes(1)
        })
    })

    describe('update', () => {
        it('should update and return updated user', async () => {
            const existing = { id: 1, email: 'old@test.com' } as unknown as User
            const dto = {} as unknown as UpdateUserDto
            mockUserRepo.findOne.mockResolvedValue(existing)
            mockUserRepo.save.mockResolvedValue({ ...existing, ...dto })

            const result = await service.update(1, dto)

            expect(mockUserRepo.save).toHaveBeenCalledTimes(1)
            expect(result).toBeDefined()
        })

        it('should throw NotFoundException when updating non-existent user', async () => {
            mockUserRepo.findOne.mockResolvedValue(null)

            await expect(service.update(999, {} as unknown as UpdateUserDto)).rejects.toThrow(NotFoundException)
        })
    })

    describe('remove', () => {
        it('should delete user by id', async () => {
            mockUserRepo.delete.mockResolvedValue({ affected: 1 })

            await service.remove(1)

            expect(mockUserRepo.delete).toHaveBeenCalledWith(1)
        })
    })
})`,
};
