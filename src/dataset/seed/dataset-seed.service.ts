import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasetPair, DatasetSplit } from '../entities/dataset-pair.entity';
import { SeedMetadata } from '../../rag/entities/seed-metadata.entity';
import * as crypto from 'crypto';

export const DATASET_GOLD_PAIRS_VERSION = 1;

export interface GoldSeedPair {
  serviceName: string;
  sourceCode: string;
  dependencyContract: string;
  systemPrompt: string;
  userPrompt: string;
  generatedSpec: string;
  split: DatasetSplit;
}

const GOLD_STANDARD_PAIRS: GoldSeedPair[] = [
  {
    serviceName: 'UserService',
    sourceCode: `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }
}`,
    dependencyContract: `--- INJECTED SERVICES & REPOSITORIES (USE THESE EXACT PRE-BUILT MOCK FIXTURES) ---
- Injected: this.userRepository (Repository<User>) [Decorator: typeorm_repository]
  MOCK FIXTURE CODE:
  const mockUserRepository = {
    find: jest.fn().mockResolvedValue([{ id: 1 }] as unknown),
    findOne: jest.fn().mockResolvedValue({ id: 1 } as unknown),
    create: jest.fn().mockImplementation((val: unknown) => Promise.resolve({ id: 1, ...(typeof val === 'object' && val !== null ? val : {}) })),
    save: jest.fn().mockImplementation((val: unknown) => Promise.resolve({ id: 1, ...(typeof val === 'object' && val !== null ? val : {}) }))
  } as unknown as Repository<User>;
  MODULE PROVIDER:
  { provide: getRepositoryToken(User), useValue: mockUserRepository }
  Required Imports: getRepositoryToken, Repository`,
    systemPrompt: `You are an expert NestJS unit test engineer. Generate comprehensive, type-safe Jest unit tests with zero 'any'.`,
    userPrompt: `Generate Jest unit test suite for UserService with 100% method and branch coverage.`,
    generatedSpec: `import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, name: 'Alice' } as unknown as User;
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      expect(result).toBe(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const dto = { name: 'Bob', email: 'bob@example.com' };
      const savedUser = { id: 2, ...dto } as unknown as User;
      (mockUserRepository.create as jest.Mock).mockReturnValue(savedUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(savedUser);

      const result = await service.create(dto as unknown as User);
      expect(result).toBe(savedUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(dto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(savedUser);
    });
  });
});`,
    split: 'train',
  },
  {
    serviceName: 'AuthService',
    sourceCode: `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  validateApiKey(key: string): boolean {
    const validKey = this.configService.get<string>('API_KEY');
    if (!key || key !== validKey) {
      throw new UnauthorizedException('Invalid API Key');
    }
    return true;
  }
}`,
    dependencyContract: `--- INJECTED SERVICES & REPOSITORIES (USE THESE EXACT PRE-BUILT MOCK FIXTURES) ---
- Injected: this.configService (ConfigService) [Decorator: config_service]
  MOCK FIXTURE CODE:
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultVal: unknown) => defaultVal ?? 'test-config-value')
  } as unknown as ConfigService;
  MODULE PROVIDER:
  { provide: ConfigService, useValue: mockConfigService }
  Required Imports: ConfigService`,
    systemPrompt: `You are an expert NestJS unit test engineer. Generate comprehensive, type-safe Jest unit tests with zero 'any'.`,
    userPrompt: `Generate Jest unit test suite for AuthService with 100% method and branch coverage.`,
    generatedSpec: `import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockConfigService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should return true when API key matches configuration', () => {
      (mockConfigService.get as jest.Mock).mockReturnValue('secret-123');

      const result = service.validateApiKey('secret-123');
      expect(result).toBe(true);
      expect(mockConfigService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should throw UnauthorizedException when API key does not match', () => {
      (mockConfigService.get as jest.Mock).mockReturnValue('secret-123');

      expect(() => service.validateApiKey('wrong-key')).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when key is empty', () => {
      (mockConfigService.get as jest.Mock).mockReturnValue('secret-123');

      expect(() => service.validateApiKey('')).toThrow(UnauthorizedException);
    });
  });
});`,
    split: 'val',
  },
  {
    serviceName: 'RedisCacheService',
    sourceCode: `import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}`,
    dependencyContract: `--- INJECTED SERVICES & REPOSITORIES (USE THESE EXACT PRE-BUILT MOCK FIXTURES) ---
- Injected: this.cacheManager (Cache) [Decorator: cache_manager]
  MOCK FIXTURE CODE:
  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined)
  };
  MODULE PROVIDER:
  { provide: CACHE_MANAGER, useValue: mockCacheManager }
  Required Imports: CACHE_MANAGER`,
    systemPrompt: `You are an expert NestJS unit test engineer. Generate comprehensive, type-safe Jest unit tests with zero 'any'.`,
    userPrompt: `Generate Jest unit test suite for RedisCacheService.`,
    generatedSpec: `import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    jest.clearAllMocks();
  });

  it('should get value from cache', async () => {
    mockCacheManager.get.mockResolvedValue('cached-data');

    const result = await service.get<string>('test-key');
    expect(result).toBe('cached-data');
    expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
  });

  it('should set value in cache', async () => {
    mockCacheManager.set.mockResolvedValue(undefined);

    await service.set('test-key', 'value', 3600);
    expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', 'value', 3600);
  });

  it('should delete key from cache', async () => {
    mockCacheManager.del.mockResolvedValue(undefined);

    await service.del('test-key');
    expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
  });
});`,
    split: 'test',
  },
];

@Injectable()
export class DatasetSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatasetSeedService.name);
  public static readonly SEED_KEY = 'SEED_DATASET_GOLD_PAIRS';

  constructor(
    @InjectRepository(DatasetPair)
    private readonly datasetRepo: Repository<DatasetPair>,
    @InjectRepository(SeedMetadata)
    private readonly seedMetadataRepo: Repository<SeedMetadata>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.runManagedSeed();
  }

  public async runManagedSeed(): Promise<boolean> {
    const key = DatasetSeedService.SEED_KEY;
    const targetVersion = DATASET_GOLD_PAIRS_VERSION;

    const existingMeta = await this.seedMetadataRepo.findOne({
      where: { key },
    });
    const currentVersion = existingMeta ? existingMeta.version : 0;

    if (currentVersion >= targetVersion) {
      this.logger.log(
        `Dataset pairs seed [${key}] is up to date (v${currentVersion}). Skipping.`,
      );
      return false;
    }

    this.logger.log(
      `Synchronizing dataset gold pairs [${key}] (version ${currentVersion} -> ${targetVersion})...`,
    );

    for (const item of GOLD_STANDARD_PAIRS) {
      const hash = crypto
        .createHash('sha256')
        .update(item.sourceCode)
        .digest('hex');
      const existing = await this.datasetRepo.findOne({
        where: { sourceHash: hash },
      });

      if (existing) {
        existing.serviceName = item.serviceName;
        existing.sourceCode = item.sourceCode;
        existing.dependencyContract = item.dependencyContract;
        existing.systemPrompt = item.systemPrompt;
        existing.userPrompt = item.userPrompt;
        existing.generatedSpec = item.generatedSpec;
        existing.evaluationScore = 80;
        existing.passedOnAttempt = 1;
        existing.methodCoverage = 100;
        existing.branchCoverage = 100;
        existing.split = item.split;
        existing.isCurated = true;
        await this.datasetRepo.save(existing);
      } else {
        const pair = this.datasetRepo.create({
          sourceHash: hash,
          serviceName: item.serviceName,
          sourceCode: item.sourceCode,
          dependencyContract: item.dependencyContract,
          systemPrompt: item.systemPrompt,
          userPrompt: item.userPrompt,
          generatedSpec: item.generatedSpec,
          evaluationScore: 80,
          passedOnAttempt: 1,
          methodCoverage: 100,
          branchCoverage: 100,
          split: item.split,
          modelProvider: 'curated-golden',
          isCurated: true,
        });
        await this.datasetRepo.save(pair);
      }
    }

    if (existingMeta) {
      existingMeta.version = targetVersion;
      existingMeta.description = `Updated dataset gold pairs to v${targetVersion}`;
      await this.seedMetadataRepo.save(existingMeta);
    } else {
      const newMeta = this.seedMetadataRepo.create({
        key,
        version: targetVersion,
        description: `Initial dataset gold pairs v${targetVersion}`,
      });
      await this.seedMetadataRepo.save(newMeta);
    }

    this.logger.log(
      `✅ Dataset gold pairs seed synchronized successfully to v${targetVersion}`,
    );
    return true;
  }
}
