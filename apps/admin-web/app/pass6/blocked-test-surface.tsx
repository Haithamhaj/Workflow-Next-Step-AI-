interface BlockedOldPass6TestSurfaceProps {
  title: string;
}

export function BlockedOldPass6TestSurface({ title }: BlockedOldPass6TestSurfaceProps) {
  return (
    <>
      <h2>{title}</h2>
      <div className="card" style={{ borderColor: "#b91c1c" }}>
        <h3>Surface retired</h3>
        <p>This old admin Pass 6/package test surface has been retired.</p>
        <p className="muted">It is not a supported production or client data surface.</p>
      </div>
    </>
  );
}
