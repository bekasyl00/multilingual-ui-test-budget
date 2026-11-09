"""Render report.md with ReportLab; PDF is not required for data reproduction."""
from html import escape
from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, Table, TableStyle, Spacer

root = Path(__file__).resolve().parent.parent
ink, blue, muted = map(colors.HexColor, ('#142336','#006962','#43566b'))
source = (root/'report.md').read_text()
fonts = [Path('/System/Library/Fonts/Supplemental/Arial.ttf'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]
font = next((p for p in fonts if p.exists()), None)
regular = 'Helvetica'
if font:
    regular='PaperSans'
    pdfmetrics.registerFont(TTFont(regular, str(font)))
styles = {
 'h1': ParagraphStyle('title', fontName='Helvetica-Bold',fontSize=25,leading=29,textColor=ink,spaceAfter=12),
 'subtitle':ParagraphStyle('subtitle',fontName=regular,fontSize=13,leading=17,textColor=blue,spaceAfter=10),
 'h2':ParagraphStyle('section',fontName='Helvetica-Bold',fontSize=17,leading=21,textColor=ink,spaceAfter=14,keepWithNext=True),
 'h3':ParagraphStyle('subsection',fontName='Helvetica-Bold',fontSize=11.3,leading=14.5,textColor=blue,spaceBefore=7,spaceAfter=5,keepWithNext=True),
 'body':ParagraphStyle('body',fontName=regular,fontSize=10,leading=14.6,textColor=ink,spaceAfter=7,allowWidows=0,allowOrphans=0),
 'cell':ParagraphStyle('cell',fontName=regular,fontSize=9.4,leading=13,textColor=ink),
 'cap':ParagraphStyle('caption',fontName=regular,fontSize=9,leading=12,textColor=muted,spaceBefore=4,spaceAfter=8),
}
pdfmetrics.registerFontFamily(regular, normal=regular, bold='Helvetica-Bold',italic='Helvetica-Oblique',boldItalic='Helvetica-BoldOblique')

def markup(text):
    text = escape(text, quote=False)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', text)
    return re.sub(r'https?://[^\s<>]+', lambda m: '<link href="'+m[0].rstrip('.')+'" color="#006962">'+m[0].rstrip('.')+'</link>'+('.' if m[0].endswith('.') else ''), text)

def grid():
    data=[['Locale / width','1280','768','375','320']]
    for i,label in enumerate(['EN','DE','FR']):
        data.append([label]+[('Spacing' if (i+j)%2 else 'Native')+(' *' if i==1 and j==3 else '') for j in range(4)])
    t=Table(data,colWidths=[130,92,92,92,92],hAlign='LEFT')
    t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6f4f2')),('TEXTCOLOR',(0,0),(-1,-1),ink),
        ('BACKGROUND',(4,2),(4,2),colors.HexColor('#ffe4ba')),('GRID',(0,0),(-1,-1),0.25,colors.HexColor('#c4d4dd')),
        ('FONTSIZE',(0,0),(-1,-1),9.5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    return [t,Paragraph('* The selected DE / 320 px cell is native. The measured clipping occurs in its unselected spacing counterpart.',styles['cap'])]

story=[]
page=0
def make_table(block):
    data=[]
    for line in block.splitlines():
        if re.match(r'^\|[|\s:\-]+\|$',line): continue
        data.append([Paragraph(markup(v.strip()),styles['cell']) for v in line.strip('|').split('|')])
    widths={3:[162,111,225],4:[128,91,127,152]}
    t=Table(data,colWidths=widths[len(data[0])],hAlign='LEFT',repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6f4f2')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f8fa')]),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),0.55,colors.HexColor('#90b4b4')),
        ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    return t

for block in re.split(r'\n\s*\n',source.strip()):
    if block == '<!-- pagebreak -->':
        story.append(PageBreak());page+=1;continue
    if block.startswith('|'):
        story.extend([make_table(block),Spacer(1,8)]);continue
    if block == '@CHECKERBOARD_FIGURE@':
        story.extend(grid());continue
    if block.startswith('#'):
        for line in block.splitlines():
            prefix, content=line.split(' ',1)
            key={'#':'h1','##':('h2' if page else 'subtitle'),'###':'h3'}[prefix]
            story.append(Paragraph(markup(content),styles[key]))
        continue
    if re.match(r'^\d+\. ',block):
        for line in block.splitlines(): story.append(Paragraph(markup(line),styles['body']))
    else: story.append(Paragraph(markup(block.replace('\n',' ')),styles['body']))

def frame(canvas,doc):
    w,h=A4
    canvas.setTitle('Testing multilingual layouts when pairwise coverage is not enough')
    canvas.setAuthor('Bekasyl Zhaksylyk (project lead)')
    canvas.setStrokeColor(colors.HexColor('#c4d4dd'))
    canvas.line(47,41,w-47,41)
    canvas.setFont('Helvetica',8)
    canvas.setFillColor(muted)
    canvas.drawString(47,27,'TECHNICAL REPORT   |   v0.1   |   10 NOV 2026')
    canvas.drawRightString(w-47,27,str(doc.page))

SimpleDocTemplate(str(root/'technical-report.pdf'), pagesize=A4, leftMargin=47,rightMargin=47,topMargin=42,bottomMargin=52).build(story,onFirstPage=frame,onLaterPages=frame)
