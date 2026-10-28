# IMovies - Movie ticket booking made simple

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) cinema booking app. Users browse movies, filter by genre, language, city, theatre and date, pick a show, choose seats on a live seat map, pay through a demo gateway, and manage their bookings. Admins manage movies, theatres and shows from a dashboard.

**Demo logins** (created automatically on first launch)

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@imovies.com | admin123 |
| User  | user@imovies.com  | user123  |

## Features

- **Auth:** register / login with JWT, passwords hashed with bcrypt.js, User and Admin roles with protected routes
- **Movie search & filter:** title search, genre, language, city, theatre, date, paginated results
- **Show selection:** 7-day date picker, shows grouped by theatre with price and seats left
- **Real-time seat map (socket.io):** seats update live for everyone viewing a show. Selected seats are locked for 5 minutes while the user pays, so two people can never book the same seat
- **Payments:** mock gateway (UPI / Card / NetBanking / Wallet) with success and failure handling. Failed payments release the seats
- **Booking history & cancellation:** upcoming vs past tabs, cancellation frees the seats and marks the payment refunded
- **Notifications:** created on booking, payment failure and cancellation
- **Admin dashboard:** CRUD for movies (with poster upload via multer), theatres and shows, plus all bookings and revenue
- **Security & ops:** JWT middleware, role checks, server-side validation, API rate limiting (stricter on login), centralized error handling, request logging (morgan), MongoDB indexes, optimistic concurrency on seat updates

## Tech stack

- **Backend:** Node.js, Express, MongoDB + Mongoose, bcryptjs, jsonwebtoken, cors, dotenv, multer, socket.io, express-rate-limit, morgan
- **Frontend:** React (Vite), React Router, Redux Toolkit, axios, Bootstrap 5, react-toastify, socket.io-client

## Project structure

```
imovies/
├── server/
│   ├── config/db.js            MongoDB connection
│   ├── models/                 User, Movie, Theatre, Show (with seats), Booking, Payment, Notification
│   ├── controllers/            auth, movie, theatre, show, booking, payment, notification
│   ├── routes/index.js         all REST routes
│   ├── middleware/             auth (JWT + admin), validate, upload (multer), error handler
│   ├── utils/                  seat helpers, async handler
│   ├── socket.js               real-time seat updates
│   ├── seed.js                 demo data
│   └── index.js                app entry
└── client/
    └── src/
        ├── pages/              Home, MovieDetails, SeatSelection, Payment, Confirmation,
        │                       MyBookings, Notifications, Login, Register, Admin
        ├── components/         Navbar, ProtectedRoute, Poster
        ├── store.js            Redux auth slice
        └── api.js              axios instance + socket
```

## Database design

| Collection    | Purpose |
|---------------|---------|
| users         | name, email, hashed password, role (user/admin) |
| movies        | title, description, genre[], language, duration, rating, poster |
| theatres      | name, city, address |
| shows         | movie, theatre, startTime, price, **seats[]** (seatNo, status available/locked/booked, lockedBy, lockedUntil) |
| bookings      | user, show, seats[], amount, status (pending/confirmed/cancelled/failed/expired), payment |
| payments      | booking, user, amount, method, status (success/failed/refunded), transactionId |
| notifications | user, message, type, read |

Each booking links a **user** to a **movie show**. Seats live inside the show document, so seat availability for a show is a single read. Indexes: movie title (text), genre, language, theatre city, show movie+time, show theatre+time, booking user+date.

## Booking flow

1. User picks seats → `POST /api/bookings` locks them for 5 minutes and creates a *pending* booking
2. Everyone on that show's seat map sees the seats turn yellow instantly (socket.io)
3. `POST /api/payments` → success marks seats *booked* and the booking *confirmed*; failure releases the seats
4. If the user never pays, the lock expires and the seats become available again
5. `PUT /api/bookings/:id/cancel` frees the seats and refunds the payment

## API endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register, /api/auth/login | Public |
| GET | /api/auth/me | User |
| GET | /api/movies?q=&genre=&language=&city=&theatre=&date=&page= | Public |
| GET | /api/movies/filters, /api/movies/:id | Public |
| POST/PUT/DELETE | /api/movies(/:id) | Admin |
| GET | /api/theatres | Public |
| POST/PUT/DELETE | /api/theatres(/:id) | Admin |
| GET | /api/shows?movie=&city=&date=, /api/shows/:id | Public |
| POST/PUT/DELETE | /api/shows(/:id) | Admin |
| POST | /api/bookings | User |
| GET | /api/bookings/my, /api/bookings/:id | User |
| PUT | /api/bookings/:id/cancel | User |
| GET | /api/bookings | Admin |
| POST | /api/payments | User |
| GET / PUT | /api/notifications, /api/notifications/read | User |

## Run locally

Requirements: Node.js 18+, a MongoDB connection string (local or MongoDB Atlas).

```bash
# 1. backend
npm install
cp .env.example .env        # then put your MONGO_URI and JWT_SECRET in .env
npm run dev                 # http://localhost:5000 (adds demo data on first run)

# 2. frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

`npm run seed` resets the database to the demo data.

## Deploy (single service on Render)

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET`

The Express server serves the built React app, so the API, sockets and frontend share one URL.

## Testing checklist

- Register, login, logout, protected pages redirect to login, admin pages blocked for normal users
- Admin CRUD for movies, theatres, shows (validation errors shown as toasts)
- Search and every filter on the home page, pagination
- Open the same show in two browsers: selecting and booking seats updates the other window live
- Try to book a seat someone else is holding → 409 error
- Payment success → confirmation page + notification; payment failure → seats released
- Cancel an upcoming booking → seats free again, payment marked refunded
- Mobile layout of every page
