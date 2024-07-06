import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput, UpdateUserInput } from './inputs/user.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserInput.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const newUser = this.usersRepository.create(createUserInput);
    return this.usersRepository.save(newUser);
  }

  async update(
    updateUserInput: UpdateUserInput,
    id: string,
  ): Promise<UpdateResult> {
    // Check if the user exists
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if the email is being updated and is unique
    if (updateUserInput.email && updateUserInput.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserInput.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.usersRepository.update(id, updateUserInput);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  delete(id: string): Promise<DeleteResult> {
    return this.usersRepository.delete(id);
  }
}
