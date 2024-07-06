import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './inputs/user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private usersService: UserService) {}

  @Query(() => [User])
  async users() {
    return this.usersService.findAll();
  }

  @Query(() => User)
  async user(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Mutation(() => GraphQLJSON)
  async updateUser(
    @Args('updateUserInput') updateUserInput: CreateUserInput,
    @Args('id') id: string,
  ) {
    return this.usersService.update(updateUserInput, id);
  }

  @Mutation(() => GraphQLJSON)
  async deleteUser(@Args('id') id: string) {
    return this.usersService.delete(id);
  }
}
