import { Test, TestingModule } from '@nestjs/testing';
import { CommonAuthService } from './common-auth.service';

describe('CommonAuthService', () => {
  let service: CommonAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonAuthService],
    }).compile();

    service = module.get<CommonAuthService>(CommonAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
