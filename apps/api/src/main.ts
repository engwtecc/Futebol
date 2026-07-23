import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Iniciando aplicação...');

  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const port = Number(process.env.PORT) || 3000;

  console.log('PORT =', process.env.PORT);

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando na porta ${port}`);
}

bootstrap();
