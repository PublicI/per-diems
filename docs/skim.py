from csv import reader,writer
from re import sub

data = reader(open("tabula-UN_DSA Rates for November 2016.csv"))
data = reader(open("UN_DSA Rates for November 2016.csv"))
output = writer(open("UN.csv","w"))

out = []
for r in data: out.append(r)

trash = [i for i in range(len(out)) if (len(out[i]) < 8) or out[i][0]=="" or "DSA Circular" in out[i][0] or 'Currency' in out[i][0] or ('Area' == out[i][0] and 'Local'==out[i][2])]

keep = [out[i] for i in range(len(out)) if not i in trash]

cc = ""
for i in range(len(keep)):
   k = keep[i]
   k = [sub("\s+"," ",l) for l in k]
   if k[0].strip() == "Note:": continue
   if "Civil Service" in k[0]: continue
   if k[0] and not k[1] and not k[2] and not k[3]:
      cc = k[0]  
      co = sub("(.*?) \(.*\)","\\1",cc)
      cu = sub(".*? \((.*)\)","\\1",cc)
      continue
   if len(k) == 9: 
      b = k.pop(1)
      k[0] = k[0]+b
   k.insert(0,co)
   k.insert(1,cu)
   output.writerow(k)
