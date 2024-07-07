# graphql-service

TODO:

- [x] GraphQL service with NestJS
- [x] BD: PostgreSQL w/ Docker
- [x] Resolver GraphQL (Get All, Get By ID, Create, Update, Delete)
- [ ] Github CD/CI with tests, create / deploy
- [ ] Upload app to AWS w/ terraform 



aws ecs describe-task-definition \
   --task-definition backend \
   --query taskDefinition > task-definition.json

