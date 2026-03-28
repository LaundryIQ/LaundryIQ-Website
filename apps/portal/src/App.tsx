import { deriveDisplayState } from "@laundryiq/utils";

const demoMachines = [
  {
    id: "WASH-1",
    name: "Washer 1",
    state: "running" as const,
    lastStateChange: Date.now() - 8 * 60_000,
    lastHeartbeat: Date.now() - 60_000,
  },
  {
    id: "DRY-1",
    name: "Dryer 1",
    state: "idle" as const,
    lastStateChange: Date.now() - 2 * 60_000,
    lastHeartbeat: Date.now() - 90_000,
  },
  {
    id: "WASH-2",
    name: "Washer 2",
    state: "off" as const,
    lastStateChange: Date.now() - 40 * 60_000,
    lastHeartbeat: Date.now() - 12 * 60_000,
  },
];

export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e2e8f0",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1120, padding: "40px 24px" }}>
        <p style={{ color: "#67e8f9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
          LaundryIQ Portal
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", marginBottom: 12 }}>
          Check machine status without calling the laundry room.
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: 720, lineHeight: 1.7 }}>
          This initial portal scaffold proves the route surface and shared state
          derivation model. Next we wire it to Convex queries and Clerk sign-in.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {demoMachines.map((machine) => {
            const displayState = deriveDisplayState(
              machine.state,
              machine.lastStateChange,
              machine.lastHeartbeat
            );

            return (
              <article
                key={machine.id}
                style={{
                  borderRadius: 24,
                  border: "1px solid #1e293b",
                  background: "rgba(15, 23, 42, 0.92)",
                  padding: 20,
                }}
              >
                <p style={{ color: "#94a3b8", margin: 0 }}>{machine.id}</p>
                <h2 style={{ marginBottom: 10 }}>{machine.name}</h2>
                <strong style={{ textTransform: "capitalize" }}>{displayState}</strong>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
