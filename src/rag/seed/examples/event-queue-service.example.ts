import { SeedDefinition } from '../types/seed-definition.type'

export const EVENT_QUEUE_SERVICE_SEED_VERSION = 1

export const eventQueueServiceSeed: SeedDefinition = {
    key: 'SEED_EXAMPLE_EVENT_QUEUE_SERVICE',
    version: EVENT_QUEUE_SERVICE_SEED_VERSION,
    title: 'Complete Service Spec — EventEmitter2 + BullMQ Queue',
    category: 'SERVICE',
    language: 'typescript',
    contentType: 'EXAMPLE',
    tags: ['EventEmitter2', 'BullMQ', 'queue', 'events', 'email', 'notifications'],
    content: `import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { getQueueToken } from '@nestjs/bullmq'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NotFoundException } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { Notification } from './notification.entity'
import { CreateNotificationDto } from './dto/create-notification.dto'

const mockNotificationRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
}

const mockEmailQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
}

const mockEventEmitter = {
    emit: jest.fn(),
}

describe('NotificationService', () => {
    let service: NotificationService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
                { provide: getQueueToken('email'), useValue: mockEmailQueue },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile()

        service = module.get<NotificationService>(NotificationService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('send', () => {
        it('should save notification, add to queue and emit event', async () => {
            const dto = { userId: 1, message: 'Welcome!' } as unknown as CreateNotificationDto
            const saved = { id: 1, ...dto } as unknown as Notification
            mockNotificationRepo.create.mockReturnValue(saved)
            mockNotificationRepo.save.mockResolvedValue(saved)

            await service.send(dto)

            expect(mockNotificationRepo.save).toHaveBeenCalledTimes(1)
            expect(mockEmailQueue.add).toHaveBeenCalledWith('send-email', expect.objectContaining({ userId: 1 }))
            expect(mockEventEmitter.emit).toHaveBeenCalledWith('notification.sent', expect.objectContaining({ id: 1 }))
        })

        it('should throw if queue fails', async () => {
            const dto = { userId: 1, message: 'Test' } as unknown as CreateNotificationDto
            mockNotificationRepo.create.mockReturnValue(dto)
            mockNotificationRepo.save.mockResolvedValue({ id: 1, ...dto })
            mockEmailQueue.add.mockRejectedValue(new Error('Queue unavailable'))

            await expect(service.send(dto)).rejects.toThrow('Queue unavailable')
        })
    })

    describe('findAllForUser', () => {
        it('should return all notifications for a user', async () => {
            const notifications = [{ id: 1 }, { id: 2 }] as unknown as Notification[]
            mockNotificationRepo.find.mockResolvedValue(notifications)

            const result = await service.findAllForUser(1)

            expect(result).toEqual(notifications)
            expect(mockNotificationRepo.find).toHaveBeenCalledWith({ where: { userId: 1 } })
        })
    })
})`,
}
