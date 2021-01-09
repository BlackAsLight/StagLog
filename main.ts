require(`dotenv`).config();
import fs from 'fs';

enum level {
	fetal = 0,
	error = 1,
	warning = 2,
	info = 3,
	debug = 4,
	verbose = 5
}

const path = (() => {
	if (process.env.LOG_PATH == undefined)
		return './logs/';
	let path = process.env.LOG_PATH;
	if (!path.endsWith('/'))
		path += '/';
	return path;
})();

const file = (() => {
	checkPath(path);
	let name = formattedDate();
	let files = fs.readdirSync(path).filter(file => file.startsWith(name));
	let num = '';
	if (files.length != 0)
		num = ` ${files.length}`;
	return name + num + '.log';
})();

const logger = fs.createWriteStream(path + file);

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

function close() {
	logger.end();
	if (fs.existsSync(path + file))
		if (fs.statSync(path + file).size == 0)
			fs.rmSync(path + file);
}

function log(title: string, level: level, message: string) {
	if (logger == undefined)
		return;
	if (level > 3)
		switch (level) {
			case 4:
				if (`${process.env.DEBUG}` != 'true')
					return;
				break;
			case 5:
				if (`${process.env.VERBOSE}` != 'true')
					return;
				break;
		}
	let type = '';
	switch (level) {
		case 5:
			type = 'VERBOSE';
			break;
		case 4:
			type = 'DEBUG';
			break;
		case 3:
			type = 'INFO';
			break;
		case 2:
			type = 'WARNING';
			break;
		case 1:
			type = 'ERROR';
			break;
		case 0:
			type = 'FETAL';
			break;
		default:
			type = 'UNKNOWN';
	}
	message = `[${formattedDateTime}] [${type}/${title}] ${message}\n`;
	logger.write(message);
}

function checkPath(path: string) {
	let folders = path.split('/');
	if (folders[folders.length - 1] == '')
		folders.pop();
	path = '';
	if (folders[0] == '.' || folders[0] == '..')
		path += `${folders.shift()}/`;
	while (folders.length > 0) {
		path += `${folders.shift()}/`;
		if (!fs.existsSync(path))
			fs.mkdirSync(path);
	}
}

function formattedDateTime(dateTime: Date = new Date(), separator: string = '-') {
	return formattedDate(dateTime, separator) + separator + formattedTime(dateTime, separator);
}

function formattedDate(date: Date = new Date(), separator: string = '-') {
	return date.getFullYear() + separator + doubleDigit(date.getMonth()) + separator + doubleDigit(date.getDate());
}

function formattedTime(time: Date = new Date(), separator: string = '-') {
	return doubleDigit(time.getHours()) + separator + doubleDigit(time.getMinutes()) + separator + doubleDigit(time.getSeconds());
}

function doubleDigit(number: number) {
	return number < 10 ? `0${number}` : number.toString();
}

(async () => {
	await sleep(10000);
	close();
})();