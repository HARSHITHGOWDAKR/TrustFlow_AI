import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service health', () => {
      const res = appController.getHealth();
      expect(res.service).toBe('TrustFlow Backend');
      expect(res.status).toBe('ok');
      expect(Array.isArray(res.routes)).toBe(true);
    });
  });
});
