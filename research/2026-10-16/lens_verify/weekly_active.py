exec(open('weekly.py').read().replace("if len(ks)<minweeks: continue","if len(ks)<minweeks or sorted(cnt.values())[len(cnt)//2]<10: continue"))
