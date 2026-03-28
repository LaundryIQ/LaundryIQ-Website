# apps/portal — LaundryIQ End-User Portal

> Vite + React — portal.laundryiq.app
> End-users: homeowners, students, family members viewing machine status.

## Who Uses This

- **Home users**: 1-2 machines, personal setup
- **Students / public**: QR code → view availability, sign up for notifications
- **Family members**: Invited via link, share view with owner

## Key Behavior

- Can VIEW without account (QR link flow)
- Account required for push notifications
- No admin features — read-only status view

## Routes

Based on `LaundryIQ-UI-Mockup/03-portal/` design specs:

| Route | Purpose |
|---|---|
| `/login` | Sign in / sign up |
| `/p` | My Places list |
| `/p/:placeId` | Machine grid for a place |
| `/p/:placeId/m/:machineId` | Machine detail modal |
| `/invite/:token` | Accept invite |
| `/settings` | Account settings |

## Data Source

All data from Convex via `@laundryiq/convex` — real-time, no polling needed.

Machine display states are derived using `@laundryiq/utils:deriveDisplayState`.
