# Employee Pair Finder

This application identifies pairs of employees who have worked together on common projects for the longest period of time.

## Features
- CRUD operations for employees and projects
- CSV file upload to process employee assignment data
- Algorithm to find the longest collaborating employee pairs
- Protected GET endpoints with JWT authentication
- Dockerized environment

## Prerequisites

Before you begin, ensure you have the following tools installed on your system:

- **Git:** For cloning the project repository.
- **Docker & Docker Compose:** For managing application containers (database, app server, etc.)
- **Node.js & npm:** Required only for local development.

## Startup Instructions

This guide provides instructions on how to run the project locally.

---

## Scenario 1: Quick Start with Docker Compose (Recommended)

This scenario uses Docker Compose to build and run all necessary application components (including the database and the application itself) inside containers.

1.  **Clone the Project:**
Open your terminal or command prompt and run the following command:
```bash
git clone https://github.com/ivaylo-kostov-it/ivaylo-kostov-employees.git
```

2.  **Navigate to the Project Directory:**
Change into the newly created project folder:
```bash
cd ./ivaylo-kostov-employees
```

3.  **Start with Docker Compose:**
Execute the following command. This will pull or build the required Docker images (if not already present) and start the containers in the background.
```bash
docker compose up -d
```

4.  **Access the Application:**
Once the containers have started successfully, the application should be accessible at `http://localhost:<SERVER_PORT>` (check the project configuration file for the specific port number).

5.  **Stop the Application:**
When you want to stop all running containers related to the project, navigate to the project directory in your terminal and run:
```bash
docker compose down
```

---

## Scenario 2: Manual Setup & Development Start

This scenario involves manually installing dependencies, building the project, starting *only* development components using Docker Compose, and then running the application server locally using `npm`.

1.  **Clone the Project:**
Open your terminal or command prompt and run the following command:
```bash
git clone https://github.com/ivaylo-kostov-it/ivaylo-kostov-employees.git
```

2.  **Navigate to the Project Directory:**
Change into the newly created project folder:
```bash
cd ./ivaylo-kostov-employees
```

3.  **Install Dependencies:**
Install all the required Node.js packages defined in the `package.json` file:
```bash
npm install
```

4.  **Start Development Components:**
Start only the development components using Docker Compose.
```bash
docker compose -f ./docker-compose.dev.yaml up -d
```
    *(If your database service has a different name in `docker-compose.yml`, replace `db` with the correct service name)*
    *Wait for the database container to start up.*

6.  **Start the Application Server:**
This starts the server in development mode and automatically restarts it when code changes are detected (hot reloading).
```bash
npm run dev
```

7.  **Stop the Services:**
* To stop the **database container** started in step 5, navigate to the project directory and run:
```bash
docker compose down
```
* To stop the **application server** (started with `npm run dev`), go to the terminal window where it is running and press `Ctrl + C`.


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

### Assignments
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
