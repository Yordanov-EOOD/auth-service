# Auth Service Testing Documentation

This document provides an overview of the tests implemented for the Auth Service.

## Test Structure

The tests are organized in the following structure:

```
tests/
├── integration/      # Integration tests for API endpoints
│   ├── auth.test.js
│   ├── health.test.js
│   ├── login.test.js
│   ├── logout.test.js
│   ├── register.test.js
│   └── refreshToken.test.js
├── unit/             # Unit tests for isolated components
│   └── simple.test.js
├── mocks/            # Mock implementations for external dependencies
│   └── http-client.js
├── setup.js          # Global test setup and configuration
└── testApp.js        # Test application setup
```

## Integration Tests

### `auth.test.js`

Tests the authentication endpoint (`/auth`) for various scenarios:

- **Successful Authentication**: Verifies that the endpoint returns a 200 status code and an access token when provided with valid credentials.
- **Invalid Credentials**: Verifies that the endpoint returns a 401 status code when provided with invalid credentials.
- **Missing Credentials**: Verifies that the endpoint returns a 400 status code when credentials are missing.

### `login.test.js`

Focuses specifically on the login functionality with a more comprehensive approach:

- **Successful Login**: Verifies that the endpoint returns a 200 status code, access token, refresh token, and user data when provided with valid credentials. Also checks that an HTTP-only cookie containing the refresh token is set.
- **Invalid Credentials**: Verifies that the endpoint returns a 401 status code with an appropriate error message when provided with invalid credentials.
- **Missing Credentials**: Verifies that the endpoint returns a 400 status code when credentials are missing.

### `refreshToken.test.js`

Tests the refresh token endpoint (`/refresh`) for various scenarios:

- **Valid Refresh Token**: Verifies that the endpoint returns a 200 status code and a new access token when provided with a valid refresh token cookie.
- **Missing Refresh Token**: Verifies that the endpoint returns a 401 status code when no refresh token cookie is provided.
- **Expired Refresh Token**: Verifies that the endpoint returns a 403 status code with an appropriate error message when an expired token is provided.

### `health.test.js`

Tests the health check endpoint (`/health`):

- **Health Check**: Verifies that the endpoint returns a 200 status code with "OK" response text, indicating that the service is up and running.

### `logout.test.js`

Tests the logout endpoint (`/logout`) for various scenarios:

- **Successful Logout**: Verifies that the endpoint returns a 204 status code and clears the refresh token cookie when a valid refresh token is provided.
- **No Token Logout**: Verifies that the endpoint returns a 204 status code when no refresh token cookie is provided (already logged out).

### `register.test.js`

Tests the registration endpoint (`/register`) for various scenarios:

- **Successful Registration**: Verifies that the endpoint returns a 201 status code with user information when valid registration data is provided.
- **Missing Fields**: Verifies that the endpoint returns a 400 status code when required fields are missing.
- **Invalid Email Format**: Verifies that the endpoint returns a 400 status code when an invalid email format is provided.
- **Password Strength**: Verifies that the endpoint returns a 400 status code when the password is too short.

## Unit Tests

### `simple.test.js`

Basic test to verify that the testing infrastructure is working correctly:

- Tests simple addition function with positive numbers
- Tests with negative numbers
- Tests with zero

## Test Setup

The `setup.js` file configures the test environment:

- Sets environment variables for testing (NODE_ENV, JWT secrets)
- Loads test-specific environment variables from `.env.test` if available
- Contains global setup and teardown hooks

## Mocks

We use mock implementations to avoid dependencies on external services during testing:

- **HTTP Client**: Mocks external API calls to user service
- **Express App**: For integration tests, we create simple Express applications that simulate the behavior of the actual endpoints without requiring the full application stack.

## Running Tests

Tests can be executed locally using the following command:

```bash
npm test
```

For watching mode (automatically re-run tests on file changes):

```bash
npm run test:watch
```

For test coverage report:

```bash
npm run test:coverage
```

### CI Integration

The tests are automatically run in the CI pipeline with GitHub Actions when code is pushed to the repository or when a pull request is created. This ensures that all changes are tested before being merged.

See `CICD.md` in the project root for more details about the CI/CD workflows.

## Testing Tools and Configuration

### Babel

Babel is configured in this project to enable the use of modern JavaScript features in tests. The project includes:

- `babel.config.json`: Configures Babel with the `@babel/preset-env` preset to target the current Node.js version.
- `babel-jest`: Allows Jest to use Babel when running tests, enabling support for ES modules and modern JavaScript syntax.

These tools enable us to write tests using the latest JavaScript features while ensuring compatibility with the current Node.js environment.

## Code Quality

### Linting

Linting is set up as a separate process from testing. It helps ensure code quality and consistency by enforcing coding standards. To run the linter:

```bash
npm run lint
```

To automatically fix linting issues where possible:

```bash
npm run lint:fix
```

The linting rules are defined in the project's ESLint configuration and include:
- Indentation (2 spaces)
- Line endings (Windows style)
- Single quotes for strings
- Semicolons required
- Warnings for unused variables and console statements

Running `npm run lint` will show all issues, while `npm run lint:fix` will automatically fix formatting issues like indentation, quotes, and semicolons, leaving only warnings about potentially problematic patterns like unused variables and console statements that require manual review.

## Test Approach

Our testing approach focuses on:

1. **Isolation**: Tests are designed to run independently without relying on external services.
2. **Simplicity**: Instead of mocking complex dependencies, we create simple implementations that mimic the expected behavior.
3. **Readability**: Tests are structured in a way that makes it easy to understand what's being tested and what the expected outcomes are.
4. **Coverage**: We aim to cover all critical paths in the authentication flow.

## Future Improvements

Potential areas for expanding test coverage:

1. **Token Validation**: Add more tests for JWT validation logic.
2. **Edge Cases**: Add tests for rate limiting, malformed requests, etc.
3. **Integration with User Service**: Add tests for interactions with the user service.
4. **End-to-End Testing**: Add tests that follow the entire authentication flow from registration to logout.
