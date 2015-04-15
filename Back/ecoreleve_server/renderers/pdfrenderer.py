
import io
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageTemplate, Frame
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus.flowables import PageBreak
from reportlab.lib import colors
from ecoreleve_server.utils.spreadsheettable import SpreadsheetTable
from reportlab.lib.pagesizes import letter, landscape

class PDFrenderer(object):
	def __init__(self):
		pass

	def addPageNumber(self,canvas, doc):

		page_num = canvas.getPageNumber()
		text = "Page %s" % page_num
		canvas.setFont('Times-BoldItalic', 9)
		canvas.drawRightString(145*mm, 5*mm, text)

	def __call__(self, value, name_vue, request):

		if request is not None:
			response = request.response
			ct = response.content_type
			if ct == response.default_content_type:
				response.content_type = 'application/pdf'
		fout = io.BytesIO()
		cols=value.get('header', [])
		rows=value.get('rows', [])
		data = []

		for obj in rows:
			row = []
			for item in obj:
				row.append(item)                
			data.append(row)

		table_font_size = 9
		if name_vue == "V_Qry_VIndiv_MonitoredLostPostReleaseIndividuals_LastStations":
			table_font_size = 8
			for key in range(len(cols)):
				if cols[key] == 'DATE':
					cols[key] = 'Date lastpos'
				elif cols[key] == 'Name_signal_type':
					cols[key] = 'Signal'
				elif cols[key] == 'MonitoringStatus@Station':
					cols[key] = 'Monitoring st.'
				elif cols[key] == 'SurveyType@Station':
					cols[key] = 'Servey type'
			cols.append('Date')
		else:
			cols.append('Date de saisie')
		cols.append('Vu')
		cols.append('Entendu')
		cols.append('Perdu')
		cols.append('Mort')
		cols.append('Repro')
		cols.append('No check')

		data.insert(0,cols)
		styleSheet = getSampleStyleSheet()
		doc=SimpleDocTemplate(fout,pagesize=landscape(A4),rightMargin=72,leftMargin=72,topMargin=20,bottomMargin=18)
		Story=[]
		styles=getSampleStyleSheet()
		styles.add(ParagraphStyle(name='Justify', alignment=TA_JUSTIFY))
		Story.append(Paragraph("Export "+name_vue, styleSheet['Title']))
		Story.append(Spacer(0, 5 * mm))
		if name_vue=="V_Qry_VIndiv_MonitoredLostPostReleaseIndividuals_LastStations":
			Story.append(Paragraph("Nom de l\'observateur:_____________________________",styleSheet['BodyText']))
			Story.append(Paragraph("Secteur de suivi: _____________________ Date de Saisie: _________________",styleSheet['BodyText']))
			Story.append(Spacer(0, 5 * mm))

		table_style=[('GRID', (0,0), (-1,-1), 1, colors.black),('ALIGN', (0,0), (-1,-1), 'CENTER'),
		('LEFTPADDING', (0,0), (-1,-1), 3),
		('RIGHTPADDING', (0,0), (-1,-1), 3),
		('FONTSIZE', (0,0), (-1,-1), table_font_size),
		('FONTNAME', (0,0), (-1,0), 'Times-Bold')
		]
		frame1 = Frame(doc.leftMargin, doc.height-5*25.4*mm,
                doc.width, 5*25.4*mm,
                leftPadding = 0, rightPadding = 0,
                topPadding = 0, bottomPadding = 0,
                id='frame1')

		spreadsheet_table = SpreadsheetTable(data, repeatRows = 1)
		spreadsheet_table.setStyle(table_style)
		Story.append(spreadsheet_table)
		Story.append(PageBreak())
		doc.build(Story, onFirstPage=self.addPageNumber, onLaterPages=self.addPageNumber)
		pdf=fout.getvalue()
		fout.close()
		return pdf
	def make_landscape(self,canvas,doc):
		canvas.setPageSize(landscape(letter))
