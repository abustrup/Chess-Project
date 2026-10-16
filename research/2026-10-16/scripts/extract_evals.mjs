import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let h = {}; const out=[];
rl.on('line', (line) => {
  if (line.startsWith('[')) { const mm = /^\[(\w+) "(.*)"\]$/.exec(line); if (mm) h[mm[1]] = mm[2]; return; }
  if (!line.trim() || !h.Event) return;
  const ev=h.Event; const w=+h.WhiteElo, b=+h.BlackElo;
  const sp = /Rated Blitz/.test(ev)?'blitz':/Rated Rapid/.test(ev)?'rapid':/Rated Classical/.test(ev)?'classical':null;
  if (sp && line.includes('[%eval') && w>=1000&&w<=1599&&b>=1000&&b<=1599) {
    const evs=[]; let ply=0; const re=/\{([^}]*)\}|(\d+\.(?:\.\.)?)|(1-0|0-1|1\/2-1\/2|\*)|([^\s{}]+)/g; let m;
    while((m=re.exec(line))!==null){ if(m[4]!==undefined){ply++;} else if(m[1]!==undefined){const e=/\[%eval ([^\]]+)\]/.exec(m[1]); if(e) evs[ply-1]=e[1];} }
    out.push(JSON.stringify({sp,w,b,res:h.Result,term:h.Termination,plies:ply,ev:evs}));
  }
  h={};
});
rl.on('close',()=>{process.stdout.write(out.join('\n')+'\n'); process.stderr.write('kept '+out.length+'\n');});
