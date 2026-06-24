# SkillSwap Hub Backend

A Node.js + Express backend API for SkillSwap Hub, a platform where users can offer and request skills, manage profiles, and discover matches based on skill preferences.

## Features

- JWT-based authentication
- User registration and login
- Profile updates with skills offered/wanted
- Skill creation, update, and deletion
- Searchable skill listings with categories, type, and keywords
- Protected API routes with authorization middleware
- Smart user matches using offered/requested skills

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- Password hashing with `bcryptjs`
- Request validation with `express-validator`
- CORS support
- Development auto-reload with `nodemon`

## Getting Started

### 1. Install dependencies

```bash
cd "c:/Users/N.Sri Sanjana/OneDrive/Desktop/SkillSwap Hub/slillswap-backend"
npm install
```

### 2. Create a `.env` file

Add the following variables in `slillswap-backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=1d
PORT=5000
```

### 3. Run the server

- Production:

```bash
npm start
```

- Development:

```bash
npm run dev
```

The API will run at `http://localhost:5000` by default.

## API Endpoints

### Health Check

- `GET /api/health`

### Authentication

- `POST /api/auth/register`
  - Body: `{ name, email, password, university }`
  - Registers a new user and returns a JWT token

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns a JWT token and user info

- `GET /api/auth/me`
  - Protected route
  - Returns the authenticated user's profile

### Users

- `GET /api/users`
  - Protected
  - Query params: `skill`, `university`, `page`, `limit`
  - Returns users excluding the current user

- `GET /api/users/:id`
  - Protected
  - Returns profile data for a specific user

- `PUT /api/users/profile`
  - Protected
  - Updates the authenticated user's profile
  - Body fields: `{ name, bio, university, skillsOffered, skillsWanted, avatar }`

- `GET /api/users/me/matches`
  - Protected
  - Returns matched users whose offered skills match the authenticated user's wanted skills

### Skills

- `GET /api/skills`
  - Query params: `category`, `type`, `search`, `page`, `limit`
  - Returns active skill listings

- `POST /api/skills`
  - Protected
  - Create a new skill listing
  - Body: `{ title, category, description, level, type, tags }`

- `PUT /api/skills/:id`
  - Protected
  - Update a skill owned by the authenticated user

- `DELETE /api/skills/:id`
  - Protected
  - Delete a skill owned by the authenticated user

## Data Models

### User

Fields:
- `name`
- `email`
- `password`
- `bio`
- `university`
- `avatar`
- `skillsOffered` (array)
- `skillsWanted` (array)
- `isVerified`

### Skill

Fields:
- `user` (reference to User)
- `title`
- `category`
- `description`
- `level`
- `type` (`offer` or `request`)
- `tags`
- `isActive`

## Notes

- The app expects `MONGO_URI` to point to a MongoDB database.
- Passwords are hashed automatically before saving.
- The application uses a text index for skill search on `title`, `description`, and `tags`.

## License

This project is provided as-is for SkillSwap Hub.
