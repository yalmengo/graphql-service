# VPC and Subnets
resource "aws_default_vpc" "default_vpc" {}

resource "aws_default_subnet" "subnet_a" {
  availability_zone       = "us-east-1a"
}

resource "aws_default_subnet" "subnet_b" {
  availability_zone       = "us-east-1b"
}

# Create a parameter group with rds.force_ssl set to 0
resource "aws_db_parameter_group" "rds_parameter_group" {
  name        = "my-rds-parameter-group"
  family      = "postgres16"
  description = "RDS parameter group with rds.force_ssl disabled"

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }
}

# PostgreSQL DB with default VPC
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = "db.t3.micro"
  db_name              = "librarydb"
  username             = "postgres"
  password             = "postgres"
  parameter_group_name = aws_db_parameter_group.rds_parameter_group.name
  skip_final_snapshot  = true
  publicly_accessible  = true
  vpc_security_group_ids = [aws_security_group.rds_security_group.id]

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "fargate-backend-logs"
  retention_in_days = 14
}

locals {
  container_definitions = [
    {
      name      = "backend"
      image     = "940878291215.dkr.ecr.us-east-1.amazonaws.com/backend:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        {
          name  = "POSTGRES_URI"
          value = "postgresql://${aws_db_instance.postgres.username}:${aws_db_instance.postgres.password}@${aws_db_instance.postgres.endpoint}/librarydb"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "${aws_cloudwatch_log_group.backend.name}"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "backend"
        }
      }
      memory = 512
      cpu    = 256
    }
  ]
}

# ECS Cluster
resource "aws_ecs_cluster" "my_cluster" {
  name = "app-cluster"
}

# Task Definition
resource "aws_ecs_task_definition" "app_task" {
  family                   = "backend"
  container_definitions    = jsonencode(local.container_definitions)
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  memory                   = 512
  cpu                      = 256
  execution_role_arn       = "${aws_iam_role.ecsTaskExecutionRole.arn}"
}

resource "aws_iam_role" "ecsTaskExecutionRole" {
  name               = "ecsTaskExecutionRole"
  assume_role_policy = "${data.aws_iam_policy_document.assume_role_policy.json}"
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ecsTaskExecutionRole_policy" {
  role       = "${aws_iam_role.ecsTaskExecutionRole.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Load Balancer
resource "aws_alb" "application_load_balancer" {
  name               = "load-balancer-dev"
  load_balancer_type = "application"
  subnets            = [
    "${aws_default_subnet.subnet_a.id}",
    "${aws_default_subnet.subnet_b.id}"
  ]
  security_groups    = ["${aws_security_group.load_balancer_security_group.id}"]
}

# Load Balancer Target Group
resource "aws_lb_target_group" "target_group" {
  name        = "target-group"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = "${aws_default_vpc.default_vpc.id}"
}

# Load Balancer Listener
resource "aws_lb_listener" "listener" {
  load_balancer_arn = "${aws_alb.application_load_balancer.arn}"
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = "${aws_lb_target_group.target_group.arn}"
  }
}

# ECS Service
resource "aws_ecs_service" "app_service" {
  name            = "graphql-service"
  cluster         = "${aws_ecs_cluster.my_cluster.id}"
  task_definition = "${aws_ecs_task_definition.app_task.arn}"
  launch_type     = "FARGATE"
  desired_count   = 1

  load_balancer {
    target_group_arn = "${aws_lb_target_group.target_group.arn}"
    container_name   = "${aws_ecs_task_definition.app_task.family}"
    container_port   = 3000
  }

  network_configuration {
    subnets          = ["${aws_default_subnet.subnet_a.id}", "${aws_default_subnet.subnet_b.id}"]
    assign_public_ip = true
    security_groups  = ["${aws_security_group.service_security_group.id}"]
  }
}

# Security Group for RDS
resource "aws_security_group" "rds_security_group" {
  name        = "rds_security_group"
  description = "Allow access to RDS from ECS"
  vpc_id      = "${aws_default_vpc.default_vpc.id}"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.service_security_group.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security Group for Load Balancer
resource "aws_security_group" "load_balancer_security_group" {
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security Group for ECS Service
resource "aws_security_group" "service_security_group" {
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    security_groups = ["${aws_security_group.load_balancer_security_group.id}"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
