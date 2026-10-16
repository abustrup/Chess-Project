import math, random, statistics as st
rnd = random.Random(7)
def p(d): return 1/(1+10**(-d/400))
def perf(scores, n):
    s = sum(scores)/n
    s = min(max(s, 0.5/n), 1-0.5/n)
    return -400*math.log10(1/s-1)  # relative to opponents' average
def games(true_diff, n, draw):
    pe = p(true_diff); out=[]
    for _ in range(n):
        u = rnd.random(); pw = max(0, pe - draw/2)
        out.append(1 if u < pw else 0.5 if u < pw+draw else 0)
    return out
for draw in (0.0, 0.05):
    for n in (25, 50, 93, 186, 370):
        sd = st.pstdev([perf(games(0, n, draw), n) for _ in range(20000)])
        print(f"draw={draw} N={n}: SD(perf)={sd:.1f}  analytic 347/sqrt(N)={347/math.sqrt(n):.1f}")
# power: before N games at true 0, after N games at true +d (opponents same rating band), one-sided/two-sided test at 1.96*SE
for d, n in ((100, 93), (100, 186), (50, 370), (50, 740)):
    se = 347*math.sqrt(2/n); hits=0; R=5000
    for _ in range(R):
        a = perf(games(0, n, 0.05), n); b = perf(games(d, n, 0.05), n)
        if b - a > 1.96*se: hits += 1
    print(f"true +{d}, N={n} each: P(detect at 1.96*SE)={hits/R:.2f}")
