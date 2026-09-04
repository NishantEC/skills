import json,sys,time
d=json.load(open(sys.argv[1]+"/frames.json"))
try:
    while True:
        for a in d["art"]:
            sys.stdout.write("\033[H\033[2J"+a+"\n");sys.stdout.flush();time.sleep(1/12)
except KeyboardInterrupt: sys.stdout.write("\033[?25h\n")
