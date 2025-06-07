# Auth Service CI/CD Workflows

This document describes the Continuous Integration/Continuous Deployment (CI/CD) workflows set up for the Auth Service using GitHub Actions.

## Workflow Overview

The Auth Service has two main CI/CD workflows:

1. **Run Tests** (`run-tests.yml`) - Runs automated tests on code changes
2. **Build and Push Docker Image** (`docker-build.yml`) - Builds and publishes Docker images

## Run Tests Workflow

This workflow automatically runs whenever code is pushed or a pull request is created, ensuring that code changes don't break existing functionality.

```mermaid
flowchart TD
    trigger["Workflow Triggers:
    - Push to main/master/develop
    - Pull requests to main/master/develop"]
    job["Job: test
    (runs on ubuntu-latest)"]
    checkout["Step 1: Checkout code
    - actions/checkout@v3"]
    setupNode["Step 2: Setup Node.js
    - actions/setup-node@v3
    - Uses Node 18.x with npm caching"]
    install["Step 3: Install dependencies
    - npm ci"]
    envSetup["Step 4: Create test environment variables
    - Creates .env.test file with test secrets"]
    runTests["Step 5: Run tests
    - npm test"]
    runLint["Step 6: Run linter
    - npm run lint"]
    
    trigger --> job
    job --> checkout
    checkout --> setupNode
    setupNode --> install
    install --> envSetup
    envSetup --> runTests
    runTests --> runLint
    
    classDef trigger fill:#f96,stroke:#333,stroke-width:2px;
    classDef job fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef step fill:#dfd,stroke:#484,stroke-width:1px;
    
    class trigger trigger;
    class job job;
    class checkout,setupNode,install,envSetup,runTests,runLint step;
```

### Key Features:
- **Node.js Setup**: Configures the Node.js environment with dependency caching for faster runs
- **Dependency Installation**: Uses `npm ci` for clean, reproducible installations
- **Test Environment**: Creates a dedicated test environment with secure test values
- **Full Test Suite**: Runs all tests including unit and integration tests
- **Code Quality**: Runs the linter to ensure code style consistency

## Build and Push Docker Image Workflow

This workflow builds and pushes a Docker image to DockerHub when code is pushed to the main branch or triggered manually.

```mermaid
flowchart TD
    trigger["Workflow Triggers:
    - Push to main/master
    - Manual trigger (workflow_dispatch)"]
    job["Job: build-and-push
    (runs on ubuntu-latest)"]
    checkout["Step 1: Checkout code
    - actions/checkout@v3"]
    buildx["Step 2: Set up Docker Buildx
    - docker/setup-buildx-action@v2"]
    env["Step 3: Create default .env file
    - Sets environment variables
    - DB credentials
    - Token secrets"]
    login["Step 4: Login to DockerHub
    - docker/login-action@v2
    - Uses DOCKERHUB_USERNAME and TOKEN secrets"]
    build["Step 5: Build and push Docker image
    - docker/build-push-action@v4
    - Pushes to DockerHub
    - Uses layer caching"]
    
    trigger --> job
    job --> checkout
    checkout --> buildx
    buildx --> env
    env --> login
    login --> build
    
    classDef trigger fill:#f96,stroke:#333,stroke-width:2px;
    classDef job fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef step fill:#dfd,stroke:#484,stroke-width:1px;
    
    class trigger trigger;
    class job job;
    class checkout,buildx,env,login,build step;
```

### Key Features:
- **Docker Buildx**: Uses Docker's Buildx for efficient multi-platform builds
- **Environment Configuration**: Creates a default environment config for the container
- **DockerHub Integration**: Authenticates and pushes to DockerHub
- **Build Optimization**: Utilizes layer caching to speed up builds

## CI/CD Pipeline Integration

These workflows work together to form a complete CI/CD pipeline:

1. When code is pushed or PRs are created, tests run automatically
2. After successful merge to main, the Docker image is built and pushed
3. The updated image can then be deployed to staging/production environments

## Required Secrets

For these workflows to function properly, the following secrets should be configured in your GitHub repository:

- `ACCESS_TOKEN_SECRET`: JWT access token secret
- `REFRESH_TOKEN_SECRET`: JWT refresh token secret
- `DOCKERHUB_USERNAME`: DockerHub username for image publishing
- `DOCKERHUB_TOKEN`: DockerHub access token for authentication
