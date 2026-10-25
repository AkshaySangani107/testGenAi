import { SeedDefinition } from '../types/seed-definition.type'

export const HTTP_SERVICE_SEED_VERSION = 1

export const httpServiceSeed: SeedDefinition = {
    key: 'SEED_EXAMPLE_HTTP_SERVICE',
    version: HTTP_SERVICE_SEED_VERSION,
    title: 'Complete Service Spec — ConfigService + HttpService (Axios)',
    category: 'SERVICE',
    language: 'typescript',
    contentType: 'EXAMPLE',
    tags: ['ConfigService', 'HttpService', 'axios', 'external-api', 'config', 'http'],
    content: `import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { of, throwError } from 'rxjs'
import { AxiosResponse } from 'axios'
import { PaymentService } from './payment.service'
import { ChargeDto } from './dto/charge.dto'

const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
}

const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
            PAYMENT_API_URL: 'https://api.payment.test',
            PAYMENT_API_KEY: 'test-api-key',
        }
        return config[key]
    }),
}

describe('PaymentService', () => {
    let service: PaymentService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                { provide: HttpService, useValue: mockHttpService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile()

        service = module.get<PaymentService>(PaymentService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('charge', () => {
        it('should call payment API and return transaction id', async () => {
            const dto = { amount: 100, currency: 'USD', cardToken: 'tok_test' } as unknown as ChargeDto
            const apiResponse = { data: { transactionId: 'txn_123', status: 'success' } } as AxiosResponse
            mockHttpService.post.mockReturnValue(of(apiResponse))

            const result = await service.charge(dto)

            expect(mockHttpService.post).toHaveBeenCalledWith(
                'https://api.payment.test/charge',
                expect.objectContaining({ amount: 100 }),
                expect.objectContaining({ headers: expect.objectContaining({ 'x-api-key': 'test-api-key' }) })
            )
            expect(result.transactionId).toBe('txn_123')
        })

        it('should throw when payment API returns error', async () => {
            const dto = { amount: 100, currency: 'USD' } as unknown as ChargeDto
            mockHttpService.post.mockReturnValue(throwError(() => new Error('Payment gateway timeout')))

            await expect(service.charge(dto)).rejects.toThrow('Payment gateway timeout')
        })
    })
})`,
}
