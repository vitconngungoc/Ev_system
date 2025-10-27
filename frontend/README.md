# EVolve Frontend (React + Vite + Tailwind)

Modern frontend for EV Station-based Rental System.
Styled like the provided RentCars hero design and wired to the backend API.

## Quick start

1) Install Node 18+
2) Run:
```bash
npm i
cp .env.example .env
npm run dev
```
The app runs at http://localhost:5173

## API endpoints used
- POST /auth/register
- POST /auth/login
- GET  /vehicles (supports params: location, pickup, returnDate)
- POST /bookings (vehicleId, pickupDate, returnDate)
- GET  /bookings
- PUT  /bookings/{id}/cancel

JWT is stored in localStorage and auto-attached via Authorization: Bearer <token>.

Adjust base URL in `.env` if your backend uses a different port.
