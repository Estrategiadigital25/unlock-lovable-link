import Toaster from "./components/ui/toaster"; // ← ruta relativa

function App() {
  return (
    <>
      {/* tu UI */}
      <Toaster /> {/* ← Montado una sola vez. Tiene guard anti-duplicados */}
    </>
  );
}

export default App;
