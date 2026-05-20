terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Example Module placeholders
module "vpc" {
  source = "./modules/vpc"
}

module "ecs_cluster" {
  source = "./modules/ecs"
  vpc_id = module.vpc.vpc_id
}
