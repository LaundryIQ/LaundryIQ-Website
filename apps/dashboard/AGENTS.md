# apps/dashboard — LaundryIQ Operator Dashboard

> Vite + React — dashboard.laundryiq.app
> Operators: laundromat owners, property managers, university facilities.

## Who Uses This

- **Place operators**: Manage their device fleet, view history, invite users
- **Power users**: Advanced settings, usage graphs, OTA management

## Routes

Based on `LaundryIQ-UI-Mockup/04-dashboard/` design specs:

| Route | Purpose |
|---|---|
| `/login` | Sign in / sign up |
| `/places` | All places (organizations) |
| `/places/:placeId` | Place overview |
| `/places/:placeId/machines` | Machine grid (list + grid toggle) |
| `/places/:placeId/machines/:machineId` | Machine history |
| `/places/:placeId/devices` | Device management |
| `/places/:placeId/devices/add` | Add device wizard |
| `/places/:placeId/users` | User management |
| `/places/:placeId/settings` | Place settings |
| `/account` | Account settings |

## Device Flow

1. Admin navigates to Devices → Add Device
2. Types device ID (from QR code or sticker)
3. Backend creates pending claim (30-day expiry)
4. Admin physically installs device, it connects to WiFi
5. Device auto-calls `/claim`, backend registers it and returns API key
6. Device shows green LED, appears in device list

## Data Source

All data from Convex via `@laundryiq/convex`.
Place = BetterAuth Organization. Members have "admin" or "viewer" roles.
