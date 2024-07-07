import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UserModule', () => {
  let userService: UserService;
  let userResolver: UserResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .compile();

    userService = module.get<UserService>(UserService);
    userResolver = module.get<UserResolver>(UserResolver);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
    expect(userResolver).toBeDefined();
  });
});
