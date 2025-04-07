# Employee Pair Finder

This application identifies pairs of employees who have worked together on common projects for the longest period of time.

## Features
- CRUD operations for employees and projects
- CSV file upload to process employee assignment data
- Algorithm to find the longest collaborating employee pairs
- Protected GET endpoints with JWT authentication
- Dockerized environment

## Prerequisites
- Node.js (v16+)
- PostgreSQL (v13+)
- Docker and Docker Compose

## Start the application locally.

1. Clone the repository:
```bash
git clone https://github.com/your-github-username/your-firstname-lastname-employees.git
cd your-firstname-lastname-employees
```

2. Start the application using Docker Compose:
```bash
docker compose up
```

The application will be available at http://localhost:3000.

## Local development setup.

1. Clone the repository:
```bash
git clone https://github.com/your-github-username/your-firstname-lastname-employees.git
cd your-firstname-lastname-employees
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the database using Docker Compose
```bash
docker compose -f ./docker-compose.db.yaml up
```

5. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Authentication

### Getting an Authentication Token

1. To get a token, make a POST request to the `/api/auth/login` endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "blackdeep"}'
```

2. The response will contain your JWT token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

5. Use this token in your GET requests:

```bash
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### For Production Use

For a production application, you should:
- Store user credentials securely in the database with hashed passwords
- Implement proper user registration and management
- Consider using refresh tokens for better security
- Add rate limiting to prevent brute force attacks

## Running Tests

Execute unit tests:
```bash
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Get JWT token with credentials

All GET requests require a JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Employee Pairs
- `GET /api/assignments/longest-collaboration` - Get the pair of employees who worked together the longest
- `POST /api/assignments/upload` - Upload CSV file with employee assignment data

## CSV Format
The CSV file should have the following format:
```
EmpID,ProjectID,DateFrom,DateTo
143,12,2013-11-01,2014-01-05
218,10,2011-04-16,undefined
```

- `DateTo` can be "undefined", which is equivalent to today's date

## Sample Output
```json
{
  "employeeId1": 143,
  "employeeId2": 218,
  "daysWorkedTogether": 11
}
```

## Database Schema

### Employee
- id (PK)
- name

### Project
- id (PK)
- name

### Assignment (Junction Table)
- id (PK)
- employeeId (FK)
- projectId (FK)
- dateFrom
- dateTo
