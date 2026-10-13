// Balance simulator: node tools/simulate.js [runs]
import { Game } from '../src/engine/game.js';
import { playRun } from './bot.js';

const runs = Number(process.argv[2] || 200);
const results = { won: 0, actDeaths: { 1: 0, 2: 0, 3: 0 }, floors: 0, deathsBy: {} };
for (let i = 0; i < runs; i++) {
  const g = Game.newRun(`SIM${i}`);
  playRun(g);
  const r = g.run;
  if (r.won) results.won++;
  else {
    results.actDeaths[r.act]++;
    const room = r.lastEncounters[r.lastEncounters.length - 1];
    results.deathsBy[room] = (results.deathsBy[room] || 0) + 1;
  }
  results.floors += r.stats.floors;
}
console.log(`Runs: ${runs}`);
console.log(`Win rate: ${((results.won / runs) * 100).toFixed(1)}%`);
console.log('Deaths by act:', results.actDeaths);
console.log(`Avg floors: ${(results.floors / runs).toFixed(1)}`);
console.log('Top killers:', Object.entries(results.deathsBy).sort((a, b) => b[1] - a[1]).slice(0, 8));
