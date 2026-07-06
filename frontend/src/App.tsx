import { useState, type ChangeEvent } from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import { ParseMarkdown } from '../wailsjs/go/main/App';

function App() {
  const [resultText, setResultText] = useState('Escribe Markdown y pulsa Renderizar 👇');
  const [source, setSource] = useState('');
  const updateSource = (e: ChangeEvent<HTMLInputElement>) => setSource(e.target.value);

  function renderMarkdown() {
    // Demo temporal del binding ParseMarkdown (la UI real llega en Fase 3).
    ParseMarkdown(source)
      .then(setResultText)
      .catch((err: unknown) => setResultText(`Error: ${String(err)}`));
  }

  return (
    <div id="App">
      <img src={logo} id="logo" alt="logo" />
      <div id="result" className="result">
        {resultText}
      </div>
      <div id="input" className="input-box">
        <input
          id="name"
          className="input"
          onChange={updateSource}
          autoComplete="off"
          name="input"
          type="text"
        />
        <button className="btn" onClick={renderMarkdown}>
          Renderizar
        </button>
      </div>
      {/* Verificación temporal de P1.3: si esto se ve en verde, Tailwind compila. */}
      <p className="mt-4 text-sm font-semibold text-emerald-400">Tailwind CSS activo ✓</p>
    </div>
  );
}

export default App;
