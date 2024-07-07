import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { DeleteResult, UpdateResult } from 'typeorm';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('users', () => {
    it('should return an array of users', async () => {
      const result: User[] = [];
      jest.spyOn(userService, 'findAll').mockImplementation(async () => result);

      expect(await resolver.users()).toBe(result);
    });
  });

  describe('user', () => {
    it('should return a single user', async () => {
      const result: User = new User();
      jest.spyOn(userService, 'findOne').mockImplementation(async () => result);

      expect(await resolver.user('1')).toBe(result);
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const input = { name: 'Test User', email: 'test@test.com' };
      const result: User = new User();
      jest.spyOn(userService, 'create').mockImplementation(async () => result);

      expect(await resolver.createUser(input)).toBe(result);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const input = { name: 'Updated User', email: 'test@test.com' };
      const result = {} as UpdateResult;
      jest.spyOn(userService, 'update').mockImplementation(async () => result);

      expect(await resolver.updateUser(input, '1')).toBe(result);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const result = {} as DeleteResult;
      jest.spyOn(userService, 'delete').mockImplementation(async () => result);

      expect(await resolver.deleteUser('1')).toBe(result);
    });
  });
});
