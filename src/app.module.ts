import { Module, OnModuleInit } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RagModule } from './rag/rag.module'
import { EmbeddingService } from './rag/embedding.service'
import { TestGenerationModule } from './generaion/generation.module'
import { TestGenerationService } from './generaion/generation.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT!,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false, // never true in production
    }),
    RagModule,
    TestGenerationModule, // ← add
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private embeddingService: EmbeddingService,
    private testGenerationService: TestGenerationService
  ) { }

  async onModuleInit() {
    // await this.embeddingService.embedAllKnowledge()

    // // Test generation
    // const testCode = await this.testGenerationService.generateTests(`
    //   import { Injectable } from '@nestjs/common'
    //   import { InjectRepository } from '@nestjs/typeorm'
    //   import { Repository } from 'typeorm'

    //   @Injectable()
    //   export class PaymentService {
    //     constructor(
    //       @InjectRepository(Payment)
    //       private readonly paymentRepo: Repository<Payment>
    //     ) {}

    //     async processPayment(userId: string, amount: number): Promise<void> {
    //       if (!userId) throw new BadRequestException('UserId required')
    //       if (amount <= 0) throw new BadRequestException('Invalid amount')
    //       const payment = this.paymentRepo.create({ userId, amount })
    //       await this.paymentRepo.save(payment)
    //     }

    //     async findAll(): Promise<Payment[]> {
    //       const payments = await this.paymentRepo.find()
    //       if (payments.length === 0) throw new NotFoundException('No payments')
    //       return payments
    //     }
    //   }
    // `)

    // console.log('Generated Tests:')
    // console.log(testCode)
  }
}