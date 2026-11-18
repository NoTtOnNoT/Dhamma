"""Build browser data from all worksheets in the three original XLSX files. Python 3, no dependencies."""
from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, json, re, collections
ROOT=Path(__file__).resolve().parents[1]
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
DIGITS=str.maketrans('๐๑๒๓๔๕๖๗๘๙','0123456789')
def read_file(path,level):
    z=zipfile.ZipFile(path); strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(t.text or '' for t in e.findall('.//s:t',NS)) for e in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)]
    records=[]; sheets=[]; skipped=0
    for f in sorted(z.namelist()):
        if not re.fullmatch(r'xl/worksheets/sheet\d+\.xml',f):continue
        count=0
        for row in ET.fromstring(z.read(f)).findall('.//s:sheetData/s:row',NS):
            cells={}
            for c in row:
                col=re.sub(r'\d','',c.get('r','')); v=c.find('s:v',NS)
                text=v.text or '' if v is not None else ''.join(t.text or '' for t in c.findall('.//s:t',NS))
                if c.get('t')=='s':text=strings[int(text)]
                cells[col]=text.strip()
            exam=cells.get('A','').translate(DIGITS)
            if not re.fullmatch(r'\d{3}\s*-\s*\d{5}',exam):
                skipped+=1;continue
            assert all(cells.get(c) for c in ('B','C','F')), (path,f,row.get('r'))
            records.append(dict(level=level,number=re.sub(r'\s','',exam),originalNumber=cells['A'],firstName=cells['B'],lastName=cells['C'],temple=cells.get('D',''),school=cells.get('E',''),room=cells['F'].translate(DIGITS),source=path.name,sheet=f.split('/')[-1],row=int(row.get('r'))))
            count+=1
        sheets.append({'sheet':f,'count':count})
    return records,dict(file=path.name,level=level,count=len(records),rooms=dict(collections.Counter(r['room'] for r in records)),sheets=sheets,skippedNonStudentRows=skipped)
def main():
    records=[]; sources=[]
    for level in ('ตรี','โท','เอก'):
        matches=list((ROOT/'source').glob('*ชั้น'+level+'*.xlsx'))
        assert len(matches)==1, ('Expected one source per level',level)
        rs,report=read_file(matches[0],level);records+=rs;sources.append(report)
    keys=[(r['level'],r['number']) for r in records]
    assert len(keys)==len(set(keys)), 'Duplicate candidate numbers'
    records.sort(key=lambda r:(('ตรี','โท','เอก').index(r['level']),int(r['room']),r['number']))
    payload=dict(year=2569,records=records,sources=sources)
    (ROOT/'assets/data.js').write_text('window.EXAM_DATA = '+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    (ROOT/'source/data-report.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps([{'level':s['level'],'count':s['count'],'rooms':s['rooms']} for s in sources],ensure_ascii=False))
if __name__=='__main__':main()
