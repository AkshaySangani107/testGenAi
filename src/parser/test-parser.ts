import { parseTypeScriptFile } from './typescript.parser'

const result = parseTypeScriptFile(`
  @Injectable()
  export class PaymentService {
    constructor(private readonly repo: PaymentRepository) {}
    async processPayment(userId: string, amount: number): Promise<void> {}
  }
`)

console.log(JSON.stringify(result, null, 2))