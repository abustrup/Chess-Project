# Self-test for newcomers.py (run: newcomers.py selftest). Constructed players and a mock Lichess (API and database
# file) on 127.0.0.1 with an ephemeral port; nothing touches the real Lichess. Checks: every step of the rule at its
# boundary, numbering with measure.py's eligible() by start time (with a game that ended out of order), the numbers against a hand calculation, a 429 answer followed by a
# full minute's wait, a cut stream asked again, one request at a time with the honest User-Agent, the stop at 100
# players, the older-month fallback, resume after a budget stop, a byte-identical rebuild, the privacy scan, and a
# 404 for an open account's history (stops, saves nothing).
import os, sys, json, math, shutil, tempfile, threading, hashlib, urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

T0 = 1700000000000          # account creation of every constructed player (ms)
DAY = 86400 * 1000


def game(gid, me, t, seq_plies, me_white=True, tc=(600, 0), analysed=None, opp_bot=False, status='resign', rated=True, ended=None):
    meu = {'user': {'name': me.upper(), 'id': me}, 'rating': 1100}
    opp = {'user': {'name': 'Opp' + gid, 'id': 'opp' + gid.lower(), **({'title': 'BOT'} if opp_bot else {})}, 'rating': 1120}
    if analysed is not None:
        meu['analysis'] = {'inaccuracy': 1, 'mistake': 1, 'blunder': analysed, 'acpl': 50, 'accuracy': 80}
        opp['analysis'] = {'inaccuracy': 0, 'mistake': 2, 'blunder': 1, 'acpl': 40, 'accuracy': 85}
    moves = ' '.join(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] * 40)
    return {'id': gid, 'rated': rated, 'variant': 'standard', 'speed': 'rapid', 'perf': 'rapid', 'createdAt': t,
            'lastMoveAt': ended if ended is not None else t + 600 * 1000,
            'status': status, 'players': {'white': meu if me_white else opp, 'black': opp if me_white else meu},
            'moves': ' '.join(moves.split()[:seq_plies]), 'clock': {'initial': tc[0], 'increment': tc[1], 'totalTime': tc[0]}}


class Player:
    """kind: good | swap | late | late_nonelig | base4 | zeromove | g159 | train9 | fewrapid | closed | missing | gone
    gone: the account lookup lists him as open, but his game history answers 404
    swap: game 40 (by start time) is his 5th analysed game in 11-40 but ended after game 41, so the export (ordered by
    end time) lists it after game 41; numbered by stream order he would fail at game 40, numbered like measure.py he is kept"""
    counter = [0]

    def __init__(self, name, kind='good', idx=0, tos=False):
        self.id = name; self.kind = kind; self.idx = idx; self.tos = tos
        self.games = self.make()

    def gid(self):
        Player.counter[0] += 1
        return f'q{Player.counter[0]:07d}'

    def make(self):
        k = self.kind; out = []; t = T0 + (60 * DAY if k == 'good' and self.idx % 3 == 0 else 2 * DAY)
        if k == 'late':
            t = T0 + 60 * DAY + 1
        if k == 'late_nonelig':
            out.append(game(self.gid(), self.id, T0 + 61 * DAY, 50, tc=(900, 10))); t = T0 + 62 * DAY
        n = 159 if k == 'g159' else 175
        for s in range(1, n + 1):
            if s == 7:       # ineligible games in between: they must not get a number
                out.append(game(self.gid(), self.id, t, 50, tc=(600, 5), analysed=1)); t += 1000
                out.append(game(self.gid(), self.id, t, 50, opp_bot=True, analysed=1)); t += 1000
                out.append(game(self.gid(), self.id, t, 0, status='aborted')); t += 1000
                out.append(game(self.gid(), self.id, t, 50, rated=False, analysed=1)); t += 1000
            an = s % 5 == 0
            if k == 'base4' and 11 <= s <= 40:
                an = s in (15, 20, 25, 30)
            if k == 'swap' and 11 <= s <= 40:
                an = s in (15, 20, 25, 30, 40)
            if k == 'train9' and 61 <= s <= 160:
                an = s in (65, 70, 75, 80, 85, 90, 95, 100, 105)
            plies = 30 + (s * 7 + self.idx) % 41
            white = (s + self.idx) % 2 == 0
            if k == 'zeromove' and s == 15:
                plies, white = 1, False       # analysed, but he never moved: does not count
            if k == 'zeromove' and s in (20, 25, 30, 35, 40):
                an = s != 40                  # with s = 15 that makes 5 analysed games, only 4 of them count
            bl = (self.idx * 7 + s * 3) % 5 if an else None
            out.append(game(self.gid(), self.id, t, plies, me_white=white, analysed=bl)); t += 3600 * 1000
        if k == 'swap':   # game 40 ends 11 minutes after game 41 ends: the export lists it after game 41
            i40 = [i for i, g in enumerate(out) if g['clock']['increment'] == 0 and g['rated'] and g['status'] != 'aborted'
                   and 'title' not in g['players']['black']['user'] and 'title' not in g['players']['white']['user']][39]
            g40 = out.pop(i40); g40['lastMoveAt'] = out[i40]['lastMoveAt'] + 660 * 1000; out.insert(i40 + 1, g40)
        return out

    def user(self):
        if self.kind == 'missing':
            return None
        if self.kind == 'closed':
            return {'id': self.id, 'username': self.id.upper(), 'disabled': True}
        return {'id': self.id, 'username': self.id.upper(), 'createdAt': T0, 'perfs': {'rapid': {'games': 100 if self.kind == 'fewrapid' else 400}},
                **({'tosViolation': True} if self.tos else {})}


def pgn_for(players, extra):
    """Database text: one rated 10+0 game per candidate at 1100 against a 1500 opponent, plus non-candidates."""
    lines = []
    def one(w, b, we, be, tc='600+0', wt=None):
        h = [('Event', 'Rated Rapid game'), ('Site', 'https://lichess.org/xxxxxxxx'), ('UTCDate', '2026.09.10'), ('UTCTime', '12:00:00'),
             ('White', w), ('Black', b), ('WhiteElo', str(we)), ('BlackElo', str(be))] + ([('WhiteTitle', wt)] if wt else []) + [('TimeControl', tc)]
        lines.append('\n'.join(f'[{k} "{v}"]' for k, v in h) + '\n\n1. e4 e5 2. Nf3 Nc6 1-0\n\n')
    for p in players:
        one(p.id.upper(), 'Strong' + p.id[-3:], 1100, 1500)
    for w, we, tc, wt in extra:
        one(w, 'Strongx', we, 1500, tc, wt)
    return ''.join(lines)


def zst_file(text, frames=16):
    import zstandard
    c = zstandard.ZstdCompressor(level=3)
    return b''.join(c.compress(text.encode()) for _ in range(frames))


class Mock:
    def __init__(self, players, dbs, cut_once=(), fail_429_once=True):
        self.players = {p.id: p for p in players}; self.dbs = dbs; self.log = []; self.inflight = 0; self.max_inflight = 0
        self.lock = threading.Lock(); self.cut = set(cut_once); self.fail_429 = fail_429_once; self.uas = set()
        mock = self

        class H(BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.1'

            def log_message(self, *a):
                pass

            def enter(self):
                with mock.lock:
                    mock.inflight += 1; mock.max_inflight = max(mock.max_inflight, mock.inflight)
                    mock.log.append((self.command, self.path)); mock.uas.add(self.headers.get('User-Agent'))

            def leave(self):
                with mock.lock:
                    mock.inflight -= 1

            def db(self):
                m = self.path.split('lichess_db_standard_rated_')[-1].split('.pgn')[0]
                return mock.dbs.get(m)

            def do_HEAD(self):
                self.enter()
                try:
                    data = self.db()
                    if data is None:
                        self.send_response(404); self.send_header('Content-Length', '0'); self.end_headers(); return
                    self.send_response(200); self.send_header('Content-Length', str(len(data)))
                    self.send_header('ETag', '"%s"' % hashlib.md5(data).hexdigest()); self.end_headers()
                finally:
                    self.leave()

            def do_POST(self):
                self.enter()
                try:
                    body = self.rfile.read(int(self.headers['Content-Length'])).decode()
                    us = [mock.players[i].user() for i in body.split(',') if i in mock.players]
                    out = json.dumps([u for u in us if u]).encode()
                    self.send_response(200); self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(out))); self.end_headers(); self.wfile.write(out)
                finally:
                    self.leave()

            def do_GET(self):
                self.enter()
                try:
                    if self.path.startswith('/standard/'):
                        data = self.db(); a, b = self.headers['Range'].split('=')[1].split('-')
                        part = data[int(a):int(b) + 1]
                        self.send_response(206); self.send_header('Content-Length', str(len(part)))
                        self.send_header('ETag', '"%s"' % hashlib.md5(data).hexdigest()); self.end_headers(); self.wfile.write(part)
                        return
                    u = urllib.parse.urlparse(self.path); uid = u.path.rsplit('/', 1)[-1]
                    q = dict(urllib.parse.parse_qsl(u.query))
                    assert q['sort'] == 'dateAsc' and q['perfType'] == 'rapid' and q['rated'] == 'true' and q['accuracy'] == 'true', q
                    if mock.fail_429:
                        mock.fail_429 = False
                        self.send_response(429); self.send_header('Content-Length', '0'); self.end_headers(); return
                    p = mock.players.get(uid)
                    if p is None or p.kind == 'gone':
                        self.send_response(404); self.send_header('Content-Length', '0'); self.end_headers(); return
                    self.send_response(200); self.send_header('Content-Type', 'application/x-ndjson')
                    self.send_header('Transfer-Encoding', 'chunked'); self.end_headers()
                    cut = uid in mock.cut
                    mock.cut.discard(uid)
                    try:
                        for k, g in enumerate(p.games):
                            if cut and k == 5:
                                self.wfile.flush(); self.close_connection = True
                                self.connection.shutdown(2); return     # the stream breaks without its last chunk
                            line = (json.dumps(g) + '\n').encode()
                            self.wfile.write(b'%x\r\n%s\r\n' % (len(line), line))
                        self.wfile.write(b'0\r\n\r\n')
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        self.close_connection = True   # the client stopped reading early: fine
                finally:
                    self.leave()

        self.srv = ThreadingHTTPServer(('127.0.0.1', 0), H)
        self.url = f'http://127.0.0.1:{self.srv.server_address[1]}'
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def games_requests(self):
        return [p for m, p in self.log if p.startswith('/api/games/user/')]

    def close(self):
        self.srv.shutdown(); self.srv.server_close()


def run(nc):
    tmp = tempfile.mkdtemp(prefix='newcomers-selftest-')
    sleeps = []
    saved = (nc.API, nc.DB, nc.PAUSE, nc.POINTS, nc.RANGE_MB)
    try:
        nc.PAUSE = 0.0; nc.POINTS = 4; nc.RANGE_MB = 0.05
        n_ok = 0

        # 0. the windows and the filter are his (imported from the prereg scripts), and the prereg hashes are checked
        assert (nc.BASE, nc.TRAIN, nc.LOOK1) == ((11, 40), (61, 160), (61, 110))
        nc.check_prereg_hashes()
        fake = os.path.join(tmp, 'prereg'); os.makedirs(fake)
        for f in ('measure.py', 'verdict.py'):
            shutil.copy(os.path.join(nc.PREREG, f), fake)
        open(os.path.join(fake, 'verdict.py'), 'a').write('# changed\n')
        real = nc.PREREG; nc.PREREG = fake
        try:
            nc.check_prereg_hashes(); raise AssertionError('a changed verdict.py was accepted')
        except SystemExit:
            pass
        finally:
            nc.PREREG = real
        try:
            nc.check_work(os.path.join(nc.HERE, 'work')); raise AssertionError('a work folder inside the repo was accepted')
        except SystemExit:
            pass
        n_ok += 3

        # 1. the rule, one player per step (pure function on constructed exports)
        def ev(p):
            gs = [dict(g, _me=p.id) for g in p.games]
            return nc.evaluate(T0, gs)
        cases = {'good': 'kept', 'swap': 'kept', 'late': 'late_start', 'late_nonelig': 'late_start', 'base4': 'base_few_analysed',
                 'zeromove': 'base_few_analysed', 'g159': 'few_games', 'train9': 'train_few_analysed'}
        for k, want in cases.items():
            out, rows, more = ev(Player('tcase' + k, k, idx=3))
            assert out == want, (k, out)
        out, rows, _ = ev(Player('tcaseidx1', 'good', idx=1))
        assert [r['seq'] for r in rows] == list(range(1, 161)), 'numbering must skip the 10+5, BOT, aborted and casual games'
        assert ev(Player('tcaseb4', 'base4', idx=3))[1][-1]['seq'] == 40, 'decided at game 40'
        sw = Player('tcaseswap2', 'swap', idx=3)
        want_t = sorted(g['createdAt'] for g in sw.games if nc.eligible(g, nc.TC))[:160]
        assert [r['t'] for r in ev(sw)[1]] == want_t, 'numbered by start time, like measure.py'
        assert ev(Player('tcaseswap3', 'swap', idx=3))[1][39]['analysed']
        stream = [dict(g, _me='tcaseswap4') for g in Player('tcaseswap4', 'swap', idx=3).games]
        cut = next(i for i in range(1, len(stream) + 1) if nc.evaluate(T0, stream[:i])[2])
        assert nc.evaluate(T0, stream[:cut])[0] == 'kept', 'the early stop must not decide before game 40 is read'
        assert len(ev(Player('tcaseln', 'late_nonelig'))[1]) == 0
        # account created exactly 60 days before the first game passes; one millisecond later fails
        assert ev(Player('tcase60', 'good', idx=3))[1][0]['t'] - T0 == 60 * DAY
        n_ok += 13

        # 2. the numbers against a hand calculation (no ratio(), no bootstrap)
        ps = [Player(f'tcalc{i:03d}', 'good', idx=i) for i in range(12)]
        changes, svars = [], []
        for p in ps:
            rows = ev(p)[1]
            def rate(lo, hi):
                rs = [r for r in rows if lo <= r['seq'] <= hi and r['analysed'] and r['my_moves'] > 0]
                B = sum(r['my_blunders'] for r in rs); M = sum(r['my_moves'] for r in rs); pr = B / M
                v = (100 / M) ** 2 * sum((r['my_blunders'] - pr * r['my_moves']) ** 2 for r in rs) * len(rs) / (len(rs) - 1)
                return 100 * pr, v
            (ra, va), (rb, vb) = rate(11, 40), rate(61, 160)
            changes.append(rb - ra); svars.append(va + vb)
        st = nc.summary(changes, svars)
        m = sum(changes) / len(changes); var = sum((x - m) ** 2 for x in changes) / (len(changes) - 1)
        assert abs(st['mean_change'] - m) < 1e-9
        assert abs(st['drift_sd'] - math.sqrt(max(0, var - sum(svars) / len(svars)))) < 1e-9
        assert 0.85 < st['mean_change_se'] / math.sqrt(var / len(changes)) < 1.15, st
        assert nc.summary(changes, svars) == st, 'the bootstrap must be deterministic'
        assert nc.summary([1.0, 1.0, 1.0], [5.0, 5.0, 5.0])['drift_sd'] == 0.0, 'drift is floored at 0'
        n_ok += 5

        # 3. the whole pipeline against a mock Lichess: every step once, a 429, a cut stream
        good = [Player(f'tgood{i:03d}', 'good', idx=i, tos=(i == 4)) for i in range(31)] + [Player('tgoodswap', 'swap', idx=5)]
        bad = [Player('tbad' + k, k, idx=2) for k in ('late', 'late_nonelig', 'base4', 'zeromove', 'g159', 'train9', 'fewrapid', 'closed', 'missing')]
        extra = [('tbotacct', 1100, '600+0', 'BOT'), ('thighrated', 1400, '600+0', None), ('tfastonly', 1100, '600+5', None)]
        db = {'2026-09': zst_file(pgn_for(good + bad, extra))}
        mock = Mock(good + bad, db, cut_once=['tgood007'])
        nc.API = nc.DB = mock.url
        wa = os.path.join(tmp, 'work-a'); outa = os.path.join(tmp, 'out-a')
        net = nc.Net(sleep=sleeps.append)
        nc.sample(wa, '2026-09', net)
        cands = {u for _, u, _ in nc.candidates(wa)[0]}
        assert cands == {p.id for p in good + bad}, sorted(cands ^ {p.id for p in good + bad})
        kept, counts, stt = nc.fetch(wa, net)
        assert stt['state'] == 'complete' and len(kept) == 32, (stt, len(kept), counts)
        assert counts == {'no_account': 2, 'few_rapid': 1, 'late_start': 2, 'base_few_analysed': 2, 'few_games': 1,
                          'train_few_analysed': 1, 'kept': 32}, counts
        assert stt['tos_flagged_kept'] == 1
        assert 61 in sleeps, 'a 429 must be followed by a full minute of waiting'
        assert any(s == 15 for s in sleeps), 'the cut stream must be asked again'
        assert mock.max_inflight == 1, f'{mock.max_inflight} requests at once'
        assert mock.uas == {nc.UA} and 'github.com/abustrup/Chess-Project' in nc.UA
        gr = mock.games_requests()
        assert not any('tbadfewrapid' in p or 'tbadclosed' in p or 'tbadmissing' in p for p in gr), 'prefiltered players are not exported'
        assert len(nc.read_saved_games(wa, 'tbadlate_nonelig')) == 1, 'stops reading once the 60-day rule fails'
        res, _ = nc.build(wa, outa, 'final')
        assert res['players'] == 32 and res['steps']['kept'] == 32 and res['steps']['candidates_in_sample'] == 41
        # hand check of the written numbers from the saved answers
        hand = []
        for p in sorted(good, key=lambda p: nc.order_key(p.id)):
            rows = ev(p)[1]
            def r(lo, hi):
                rs = [x for x in rows if lo <= x['seq'] <= hi and x['analysed'] and x['my_moves'] > 0]
                return 100 * sum(x['my_blunders'] for x in rs) / sum(x['my_moves'] for x in rs)
            hand.append(r(61, 160) - r(11, 40))
        assert abs(res['mean_change'] - round(sum(hand) / len(hand), 4)) < 1e-9, (res['mean_change'], sum(hand) / len(hand))
        rows_csv = open(os.path.join(outa, 'players.csv')).read().splitlines()
        assert len(rows_csv) == 33 and rows_csv[1].startswith('N001,')
        n_ok += 14

        # 4. byte-identical rebuild from the saved answers (no network: the mock is closed)
        mock.close(); nc.API = nc.DB = 'http://127.0.0.1:9'
        outb = os.path.join(tmp, 'out-b'); nc.build(wa, outb, 'final')
        for f in ('newcomers.json', 'players.csv'):
            assert open(os.path.join(outa, f), 'rb').read() == open(os.path.join(outb, f), 'rb').read(), f
        n_ok += 1

        # 5. resume after a budget stop gives the same files as one run
        mock = Mock(good + bad, db, fail_429_once=False); nc.API = nc.DB = mock.url
        wc = os.path.join(tmp, 'work-c'); outc = os.path.join(tmp, 'out-c')
        net = nc.Net(sleep=sleeps.append); nc.sample(wc, '2026-09', net)
        _, _, s1 = nc.fetch(wc, net, max_exports=5)
        assert s1['state'] == 'budget', s1
        try:
            nc.build(wc, outc, 'final'); raise AssertionError('an unfinished run must not write newcomers.json')
        except SystemExit:
            pass
        _, _, s2 = nc.fetch(wc, nc.Net(sleep=sleeps.append))
        assert s2['state'] == 'complete'
        nc.build(wc, outc, 'final')
        ja, jc = json.load(open(os.path.join(outa, 'newcomers.json'))), json.load(open(os.path.join(outc, 'newcomers.json')))
        ja.pop('answers_saved'); jc.pop('answers_saved')
        assert ja == jc, 'resumed run differs'
        assert open(os.path.join(outa, 'players.csv'), 'rb').read() == open(os.path.join(outc, 'players.csv'), 'rb').read()
        mock.close()
        n_ok += 3

        # 6. stop at 100 players: the 101st-104th qualifying players are never asked for
        many = [Player(f'tmany{i:03d}', 'good', idx=i) for i in range(104)]
        mock = Mock(many, {'2026-09': zst_file(pgn_for(many, []))}, fail_429_once=False); nc.API = nc.DB = mock.url
        wd = os.path.join(tmp, 'work-d'); net = nc.Net(sleep=sleeps.append); nc.sample(wd, '2026-09', net)
        kept, counts, std = nc.fetch(wd, net)
        assert len(kept) == 100 and std['tried'] == 100 and std['state'] == 'complete'
        order = sorted((p.id for p in many), key=nc.order_key)
        asked = {p.split('/api/games/user/')[1].split('?')[0] for p in mock.games_requests()}
        assert asked == set(order[:100]), 'exactly the first 100 in the fixed order'
        mock.close()
        n_ok += 2

        # 7. fewer than 30 after every September candidate: the August sample is added, and only then
        sep = [Player(f'tsep{i:03d}', 'good', idx=i) for i in range(10)]
        aug = [Player(f'taug{i:03d}', 'good', idx=i) for i in range(25)]
        mock = Mock(sep + aug, {'2026-09': zst_file(pgn_for(sep, [])), '2026-08': zst_file(pgn_for(aug + sep[:3], []))},
                    fail_429_once=False)
        nc.API = nc.DB = mock.url
        we = os.path.join(tmp, 'work-e'); net = nc.Net(sleep=sleeps.append); nc.sample(we, '2026-09', net)
        kept, counts, ste = nc.fetch(we, net)
        assert ste['months'] == ['2026-09', '2026-08'] and len(kept) == 35 and ste['state'] == 'complete', ste
        assert sum(1 for p in mock.games_requests() if 'tsep000' in p) == 1, 'a player seen in September is not asked again'
        res_e, _ = nc.build(we, os.path.join(tmp, 'out-e'), 'final')
        assert [s['month'] for s in res_e['database_sample']] == ['2026-09', '2026-08']
        mock.close()
        n_ok += 3

        # 8. privacy scan: the outputs hold no username and no game id; a planted one is found
        files = [os.path.join(outa, 'newcomers.json'), os.path.join(outa, 'players.csv')]
        hits, nn, ni = nc.scan(wa, files)
        assert hits == [] and nn >= 41 and ni > 1000, (hits, nn, ni)
        gid = nc.read_saved_games(wa, 'tgood003')[0]['id']
        planted = os.path.join(tmp, 'planted.md'); open(planted, 'w').write(f'see TGOOD003 and game {gid.upper()}\n')
        hits, _, _ = nc.scan(wa, [planted])
        assert {(k, t) for _, k, t in hits} == {('username', 'tgood003'), ('game id', gid)}, hits
        sub = os.path.join(tmp, 'folder', 'power'); os.makedirs(sub); shutil.copy(planted, sub)
        hits, _, _ = nc.scan(wa, [os.path.join(tmp, 'folder')])
        assert len(hits) == 2, 'a folder given to the scan must be searched file by file'
        n_ok += 3

        # 8b. a 404 for the history of an account listed as open stops the run and saves nothing (not "no games")
        mock = Mock([Player('tgone', 'gone')], {}, fail_429_once=False); nc.API = nc.DB = mock.url
        wg = os.path.join(tmp, 'work-g')
        try:
            nc.fetch_games(wg, 'tgone', T0, nc.Net(sleep=sleeps.append)); raise AssertionError('a 404 history was saved')
        except SystemExit:
            pass
        assert nc.read_saved_games(wg, 'tgone') is None, 'nothing is saved after a 404'
        mock.close()
        n_ok += 1

        # 9. verdict.py reads the file (binding with 30+ players, not with fewer)
        from verdict import newcomer_valid
        assert newcomer_valid(json.load(open(os.path.join(outa, 'newcomers.json'))))
        n_ok += 1
        print(f'selftest passed: {n_ok} checks (windows, filter and prereg hashes; the rule at every step and boundary; '
              f'numbers vs a hand calculation; mock API: 429 wait {nc.WAIT_429} s, cut stream asked again, one request at '
              f'a time, honest User-Agent; byte-identical rebuild; resume; stop at {nc.STOP_AT}; older-month fallback; '
              f'privacy scan; a 404 history stops the run; verdict.py accepts the file)')
    finally:
        nc.API, nc.DB, nc.PAUSE, nc.POINTS, nc.RANGE_MB = saved
        shutil.rmtree(tmp, ignore_errors=True)
