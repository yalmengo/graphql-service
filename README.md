# Graphql Service

## Table of Contents

- [Graphql Service](#graphql-service)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Local Installation](#local-installation)
      - [Using Docker](#using-docker)
      - [Without Docker](#without-docker)
      - [Tests](#tests)
  - [Deploy](#deploy)
  - [CI/CD](#cicd)

## Introduction

This project is a backend service built with NestJS, GraphQL and connected to a PostgreSQL database. The service is containerized using Docker and deployed to AWS ECS. The CI/CD pipeline is configured using GitHub Actions.

## Getting Started

### Prerequisites

Make sure you have the following installed on your local machine:

- Node.js (version 20 or higher)
- npm (version 6 or higher)
- Docker
- Postgres (if you don't want to use Docker for local setup)
- [Terraform](https://www.terraform.io/) & [aws-cli](https://aws.amazon.com/cli/) (only to deploy AWS resources)

### Local Installation

Clone the repository:

```bash
    git clone https://github.com/yalmengo/graphql-service.git
    cd graphql-service
```

#### Using Docker

1. Run docker compose
    ```bash
    cd backend
    docker-compose up -d
    ```

#### Without Docker

1. Install dependencies
   ```bash
   cd backend
   npm install
   ```

2. Copy environment variables
    ```bash
    cp .env.sample .env
    ```

3. Setup a postgres DB and ensure the DB name match with the connection string in `.env` file
    > Configuration example: user = postgres, password = postgres, db_name = library 
    
4. Run the app
    ```bash
    npm run start:dev
    ```

    or 

    ```bash
    npm run start:prod
    ```

5. Open GraphQL playground: http://localhost:3000/graphql

**Note:** Example queries can be found in [queries.gql](queries.gql).

#### Tests

Unit tests:
```bash
npm run test
```

E2E tests:
```bash
npm run test:e2e
```

## Deploy

To deploy the application follow these steps:

1. Init terraform
    ```bash
    cd terraform
    terraform init
    ```
3. Copy env variables and fill out with your credentials 
   ```bash
   cp terraform.tfvars.sample terraform.tfvars
   ```
4. Go to AWS ECR and create a repository with the name `backend` to store the images
5. Deploy aws resources
    ```bash
    terraform apply --auto-approve
    ```
6. Update task definition file 
    ```bash
    aws ecs describe-task-definition \
        --task-definition backend \
        --query taskDefinition > task-definition.json
    ```
7. Copy and open URL

:warning: **Note**: In order to the github action to work you need to upload the secrets to the repository.

To delete the AWS resources run:
```bash
#pwd: terraform
terraform destroy --auto-approve
```

**Current deployment URL**: http://load-balancer-dev-1616329709.us-east-1.elb.amazonaws.com/graphql

## CI/CD

The CI/CD pipeline is configured using GitHub Actions and is defined in the `.github/workflows/ci-cd.yml` file.

The pipeline includes the following steps:

1. **Build**: Compiles the source code.
2. **Test**: Runs unit and integration tests.
3. **Test e2e**: Runs end-to-end tests.
4. **Deploy**: Deploys the application on AWS ECS if the workflow is triggered manually (`workflow_dispatch`).

For more details, check the CI/CD configuration file at [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml).

:warning:
**Note:** CI/CD will be executed if the `backend` folder is modified or if it's trigger manually.

