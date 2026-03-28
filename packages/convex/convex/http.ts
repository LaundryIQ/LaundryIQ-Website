/**
 * LaundryIQ Device REST API — Convex HTTP Actions
 *
 * All device endpoints follow the contract documented in:
 * ../../api/requests.http
 *
 * Routes:
 *   POST /api/v1/device/claim
 *   POST /api/v1/device/heartbeat
 *   POST /api/v1/device/state
 *   GET  /api/v1/device/ota/check
 */
import { httpRouter } from "convex/server";

const http = httpRouter();

// TODO: implement routes following LaundryIQ-Plan/docs/software/api-endpoints.md

export default http;
