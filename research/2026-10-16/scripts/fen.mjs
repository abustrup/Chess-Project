import { Chess } from '/Users/alexanderbustrup/Chess-Project/node_modules/chess.js/dist/esm/chess.js';
const c = new Chess(); for (const m of process.argv[2].split(' ')) c.move(m); console.log(c.fen());
