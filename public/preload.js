const os = require('os');

// imports
window.xlsToJson = require('convert-excel-to-json');
window.csvToJson = require('csvjson');
window.electron = require('electron');
window.fs = require('file-system');
window.path = require('path');
window.qr = require('qr-image');
window.pdf = require('pdfkit');
window.hid = require('node-hid');

// constants
window.constants = {
	baseDir: path.join(os.homedir(), 'Documents', 'zonagrad_testing'),
	levels: {
		PRE: 'Pre-escolar',
		PRI: 'Primaria',
		SEC: 'Secundaria',
		TEC: 'Secundaria Técnica',
		PRP: 'Preparatoria',
		UNI: 'Universidad',
		POS: 'Posgrado',
		DIP: 'Diplomado',
		CUR: 'Curso',
		TAL: 'Taller',
		CER: 'Certificado'
	},
	shifts: {
		M: 'Matutino',
		I: 'Intermedio',
		V: 'Vespertino'
	},
	defaultToast: {
		message: '[DEFAULT TOAST]',
		intent: 'primary',
		duration: 3000
	}
}
