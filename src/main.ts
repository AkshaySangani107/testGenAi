import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))

  const server = await app.listen(3000)
  
  // Increase timeouts to handle long-running LLM tasks and prevent ECONNRESET on keep-alive
  server.setTimeout(300000)
  server.keepAliveTimeout = 300000
  server.headersTimeout = 301000

  console.log('TestGenAI backend running on port 3000')
}

bootstrap()