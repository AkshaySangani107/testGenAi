import { parseTypeScriptFile } from './parser/typescript.parser'

const result = parseTypeScriptFile(`
  import { Injectable } from '@nestjs/common'

  @Injectable()
  export class PaymentService {
    constructor(private readonly repo: PaymentRepository) {}

    async processPayment(userId: string, amount: number): Promise<void> {
      // logic
    }

    findAll(): Promise<Payment[]> {
      return this.repo.findAll()
    }
  }
`)

console.log(JSON.stringify(result, null, 2))