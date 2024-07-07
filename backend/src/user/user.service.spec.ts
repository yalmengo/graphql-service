import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockUserRepository = (): MockRepository<User> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<MockRepository>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const newUser = { email: 'test@example.com', name: 'Test User' };
      userRepository.findOne.mockResolvedValue(undefined);
      userRepository.create.mockImplementation((user) => user);
      userRepository.save.mockResolvedValue({ id: '1', ...newUser });

      const result = await service.create(newUser);

      expect(result).toEqual({ id: '1', ...newUser });
      expect(userRepository.create).toHaveBeenCalledWith(newUser);
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should throw a conflict exception if email already exists', async () => {
      userRepository.findOne.mockResolvedValue(new User());

      const newUser = { email: 'test@example.com', name: 'Test User' };

      await expect(service.create(newUser)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne('non-existing-id');

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      const updateUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };
      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.update.mockResolvedValue({ ...user, ...updateUserDto });

      const result = await service.update(updateUserDto, '1');

      expect(result).toEqual({ ...user, ...updateUserDto });
      expect(userRepository.update).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('should throw NotFoundException if user to update not found', async () => {
      userRepository.findOne.mockResolvedValue(undefined);

      await expect(service.update({}, 'non-existing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };

      userRepository.find.mockResolvedValue([user]);

      const result = await service.findAll();

      expect(result).toEqual([user]);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a user successfully', async () => {
      userRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete('1');

      expect(result).toEqual({ affected: 1 });
      expect(userRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should return null if user to delete not found', async () => {
      userRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.delete('non-existing-id');

      expect(result).toEqual({ affected: 0 });
    });
  });
});
