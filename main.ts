require(`dotenv`).config();
import fs from 'fs';
import schedule from 'node-schedule';

export enum level {
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
let file = getFile();
let logger = fs.createWriteStream(path + file);

schedule.scheduleJob('Stag Logger', '0 0 * * *', () => {
	close();
	file = getFile();
	logger = fs.createWriteStream(path + file);
});

export function log(title: string, level: level, message: string) {
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
	message = `[${formattedDateTime()}] [${type}/${title}] ${message}`;
	if (logger != undefined)
		try {
			logger.write(message + '\n');
		}
		catch (e) {
			console.log(`[${formattedDateTime()}] [ERROR/StagLog] ${e}`);
		}
	console.log(message);
}

export function closeLogger() {
	schedule.cancelJob('Stag Logger');
	close();
}

function close() {
	logger.end();
	if (fs.existsSync(path + file))
		if (fs.statSync(path + file).size == 0)
			fs.rmSync(path + file);
}

function getFile() {
	checkPath(path);
	let name = process.env.LOG_PREFIX == undefined ? '' : process.env.LOG_PREFIX + ' ';
	name += formattedDate();
	let files = fs.readdirSync(path).filter(file => file.startsWith(name));
	let num = 0;
	if (files.length != 0)
		num = files.length;
	while (fs.existsSync(`${name} ${num}.log`))
		num++;
	if (num == 0)
		return `${name}.log`;
	return `${name} ${num}.log`;
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