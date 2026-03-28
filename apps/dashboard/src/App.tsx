const metrics = [
  { label: "Connected devices", value: "18" },
  { label: "Machines running", value: "7" },
  { label: "Offline alerts", value: "2" },
  { label: "Pending claims", value: "3" },
];

const actions = [
  "Create place + machine records",
  "Generate pending claims from dashboard",
  "Wire device claim flow to Convex HTTP actions",
  "Add machine history + notifications",
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
      <div style={{ margin: "0 auto", maxWidth: 1200, padding: "40px 24px" }}>
        <p style={{ color: "#67e8f9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
          LaundryIQ Dashboard
        </p>
        <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.25rem)", marginBottom: 12 }}>
          Operate your laundry fleet from one place.
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: 760, lineHeight: 1.7 }}>
          This is the first real dashboard scaffold: summary metrics, device
          workflow priorities, and the Clerk/Convex wiring surface for operator
          access control.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              style={{
                borderRadius: 24,
                border: "1px solid #1e293b",
                background: "rgba(15, 23, 42, 0.92)",
                padding: 20,
              }}
            >
              <p style={{ color: "#94a3b8", margin: 0 }}>{metric.label}</p>
              <strong style={{ display: "block", fontSize: 36, marginTop: 8 }}>
                {metric.value}
              </strong>
            </article>
          ))}
        </section>

        <section
          style={{
            marginTop: 28,
            borderRadius: 28,
            border: "1px solid #1e293b",
            background: "rgba(15, 23, 42, 0.92)",
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Current implementation sequence</h2>
          <ol style={{ color: "#94a3b8", lineHeight: 1.8, paddingLeft: 20 }}>
            {actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
