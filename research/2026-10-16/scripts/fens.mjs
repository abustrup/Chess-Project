import { createRequire } from 'module';
const require = createRequire('/Users/alexanderbustrup/Chess-Project/package.json');
const { Chess } = require('chess.js');
const lines = {
 'CK advance 5.Be2': 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2',
 'CK exchange': 'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3',
 'CK 2.Bc4 (club)': 'e4 c6 Bc4 d5 exd5 cxd5 Bb3 Nf6',
 'CK 2.Nf3 d5 3.d3 (club)': 'e4 c6 Nf3 d5 d3 dxe4 dxe4 Qxd1+ Kxd1',
 'CK 2.Qf3?! (club)': 'e4 c6 Qf3 d5 exd5 cxd5 Bb5+ Nc6',
 'Slav main 4.Nc3 dxc4': 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5',
 'Slav 3.Nc3 e5?! (club)': 'd4 d5 c4 c6 Nc3 e5 dxe5 d4 Ne4',
 'London vs ...c5 Qb6': 'd4 d5 Bf4 c5 e3 Nc6 c3 Qb6 Qb3 c4 Qc2',
 'London 1100 ...Bg4 h3': 'd4 d5 Bf4 Nf6 e3 Bg4 Nf3 e6 h3 Bh5 Nbd2 Nbd7 c3 Bd6 Bxd6 cxd6',
 'London ...g5?! (club)': 'd4 d5 Bf4 Nf6 e3 g5 Bxg5 Ne4 Bf4',
};
for (const [k,v] of Object.entries(lines)) { const c=new Chess(); for (const m of v.split(' ')) c.move(m); console.log(k+'\t'+c.fen()); }
