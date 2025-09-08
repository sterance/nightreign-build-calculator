import './App.css'

function App() {
  return (
    <div className="app-container">
      <h1>Nightreign Build Calculator</h1>

      <div className="card-container">
        <div id="character-card" className="card">
          <h2>Character Selection</h2>
          <div className="image-grid">
            <img src="/characters/wylder.png" alt="wylder" />
            <img src="/characters/guardian.png" alt="guardian" />
            <img src="/characters/ironeye.png" alt="ironeye" />
            <img src="/characters/duchess.png" alt="duchess" />
            <img src="/characters/raider.png" alt="raider" />
            <img src="/characters/revenant.png" alt="revenant" />
            <img src="/characters/recluse.png" alt="recluse" />
            <img src="/characters/executor.png" alt="executor" />
          </div>
        </div>

        <div id="chalice-card" className="card">
          <h2>Chalice Selection</h2>
        </div>

        <div id="effects-card" className="card">
          <h2>Desired Effects</h2>
          <input type="text" />
        </div>

        <div id="relics-card" className="card">
          <h2>Relics</h2>

        </div>
      </div>

      <button id="calculate-button">Calculate</button>
    </div>
  )
}

export default App