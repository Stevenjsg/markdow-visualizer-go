import { useState, type ChangeEvent } from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import { Greet } from '../wailsjs/go/main/App';

function App() {
  const [resultText, setResultText] = useState('Please enter your name below 👇');
  const [name, setName] = useState('');
  const updateName = (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value);
  const updateResultText = (result: string) => setResultText(result);

  function greet() {
    Greet(name).then(updateResultText);
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
          onChange={updateName}
          autoComplete="off"
          name="input"
          type="text"
        />
        <button className="btn" onClick={greet}>
          Greet
        </button>
      </div>
      {/* Verificación temporal de P1.3: si esto se ve en verde, Tailwind compila. */}
      <p className="mt-4 text-sm font-semibold text-emerald-400">Tailwind CSS activo ✓</p>
    </div>
  );
}

export default App;
