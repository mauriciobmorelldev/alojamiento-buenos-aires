export default function Loading() {
  return (
    <main className="aba-public aba-loader" aria-label="Cargando Alojamiento Buenos Aires">
      <div className="aba-loader__plate" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="aba-loader__content">
        <p className="aba-label">Alojamiento Buenos Aires</p>
        <h1>La ciudad se está abriendo.</h1>
        <div className="aba-loader__rail">
          <span>Propiedades</span>
          <span>Barrios</span>
          <span>Arte y Cultura</span>
        </div>
      </div>
    </main>
  );
}