import { Test, TestingModule } from '@nestjs/testing';
import { TavusService } from './tavus.service';

describe('TavusService', () => {
  let service: TavusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TavusService],
    }).compile();

    service = module.get<TavusService>(TavusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
