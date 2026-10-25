import { SeedDefinition } from '../types/seed-definition.type';

export const AUTH_SERVICE_SEED_VERSION = 1;

export const authServiceSeed: SeedDefinition = {
  key: 'SEED_EXAMPLE_AUTH_SERVICE',
  version: AUTH_SERVICE_SEED_VERSION,
  title: 'Complete Auth Service Spec — JWT + bcrypt',
  category: 'AUTH',
  language: 'typescript',
  contentType: 'EXAMPLE',
  tags: [
    'auth',
    'jwt',
    'bcrypt',
    'login',
    'register',
    'JwtService',
    'UnauthorizedException',
  ],
  content: `import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UnauthorizedException, ConflictException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { User } from '../user/user.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
}

const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
}

describe('AuthService', () => {
    let service: AuthService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile()

        service = module.get<AuthService>(AuthService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('login', () => {
        it('should return access token on valid credentials', async () => {
            const dto = { email: 'user@test.com', password: 'Password123!' } as unknown as LoginDto
            const mockUser = { id: 1, email: dto.email, password: 'hashed' } as unknown as User
            mockUserRepo.findOne.mockResolvedValue(mockUser)
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true))

            const result = await service.login(dto)

            expect(result).toEqual({ accessToken: 'mock.jwt.token' })
            expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 1, email: dto.email })
        })

        it('should throw UnauthorizedException when password is wrong', async () => {
            const dto = { email: 'user@test.com', password: 'wrongpass' } as unknown as LoginDto
            const mockUser = { id: 1, email: dto.email, password: 'hashed' } as unknown as User
            mockUserRepo.findOne.mockResolvedValue(mockUser)
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false))

            await expect(service.login(dto)).rejects.toThrow(UnauthorizedException)
        })

        it('should throw UnauthorizedException when user not found', async () => {
            mockUserRepo.findOne.mockResolvedValue(null)

            await expect(service.login({ email: 'no@test.com', password: 'x' } as unknown as LoginDto))
                .rejects.toThrow(UnauthorizedException)
        })
    })

    describe('register', () => {
        it('should hash password and save new user', async () => {
            const dto = { email: 'new@test.com', password: 'Password123!' } as unknown as RegisterDto
            mockUserRepo.findOne.mockResolvedValue(null)
            jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPwd'))
            const created = { id: 1, email: dto.email, password: 'hashedPwd' } as unknown as User
            mockUserRepo.create.mockReturnValue(created)
            mockUserRepo.save.mockResolvedValue(created)

            const result = await service.register(dto)

            expect(mockUserRepo.save).toHaveBeenCalledTimes(1)
            expect(result.password).not.toBe(dto.password)
        })

        it('should throw ConflictException when email already exists', async () => {
            mockUserRepo.findOne.mockResolvedValue({ id: 1 } as unknown as User)

            await expect(service.register({ email: 'existing@test.com', password: 'x' } as unknown as RegisterDto))
                .rejects.toThrow(ConflictException)
        })
    })
})`,
};
