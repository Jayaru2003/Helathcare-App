variable "vpc_id" {}

# Placeholder for ECS module
resource "aws_ecs_cluster" "main" {
  name = "healthbridge-cluster"
}
