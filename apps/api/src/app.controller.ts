import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  home() {
    return {
      application: 'Futebol Hawai API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date()
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok'
    };
  }
}
