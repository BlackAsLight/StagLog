require(`dotenv`).config();
import fs from 'fs';
import schedule from 'node-schedule';
import zlib from 'zlib';

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
let filename = getFile();
let logger = fs.createWriteStream(path + filename);
combineLogFiles();

schedule.scheduleJob('Stag Logger', '0 0 * * *', () => {
	close();
	filename = getFile();
	logger = fs.createWriteStream(path + filename);
	combineLogFiles();
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
	if (fs.existsSync(path + filename))
		if (fs.statSync(path + filename).size == 0)
			fs.rmSync(path + filename);
}

function combineLogFiles() {
	let files = fs.readdirSync(path).filter(file => file.endsWith('.log'));
	let prefix = process.env.LOG_PREFIX == undefined ? '' : process.env.LOG_PREFIX + ' ';
	if (prefix != '')
		files = files.filter(file => file.startsWith(prefix));
	files = files.filter(file => file != filename);
	while (files.length > 0) {
		let name = files[0].slice(0, prefix.length + 10);
		let subFiles: string[] = [];
		for (let i = 0; i < files.length; i++)
			if (files[i].startsWith(name))
				subFiles.push(files.splice(i--, 1)[0]);
		if (subFiles.length == 1) {
			let file = subFiles.shift()
			if (file?.startsWith(prefix + formattedDate()))
				continue;
			let writeStream = fs.createWriteStream(path + file + '.gz');
			const gzip = zlib.createGzip();
			fs.createReadStream(path + file)
				.pipe(gzip)
				.on('data', (chunk) => {
					writeStream.write(chunk);
				})
				.on('close', () => {
					writeStream.close();
					fs.rmSync(path + file);
				});
		}
		else {
			subFiles.sort((x, y) => x.length < y.length ? -1 : 0);
			let writeStream = fs.createWriteStream(path + '_temp ' + name + '.log');
			writeToStream(writeStream, subFiles, () => fs.renameSync(path + '_temp ' + name + '.log', path + name + '.log'));
		}
	}
}

function writeToStream(writeStream: fs.WriteStream, files: string[], cb?: Function) {
	if (files.length > 0) {
		let file = files.shift();
		fs.createReadStream(path + file)
			.on('data', (chunk) => writeStream.write(chunk))
			.on('close', () => {
				fs.rmSync(path + file);
				writeToStream(writeStream, files, cb);
			});
	}
	else {
		writeStream.close();
		if (cb != undefined)
			cb();
	}
}

function getFile() {
	checkPath(path);
	let name = process.env.LOG_PREFIX == undefined ? '' : process.env.LOG_PREFIX + ' ';
	name += formattedDate();
	let files = fs.readdirSync(path).filter(file => file.startsWith(name));
	let num = 0;
	if (files.length != 0)
		num = files.length - 1;
	if (num == 0 && fs.existsSync(`${path}${name}.log`) && fs.statSync(`${path}${name}.log`).size != 0)
		num++;
	while (fs.existsSync(`${path}${name} ${num}.log`) && fs.statSync(`${path}${name} ${num}.log`).size != 0)
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

let dic = [
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
for (let j = 0; j < 50; j++) {
	let string = '';
	for (let i = 0; i < 1000; i++)
		string += dic[Math.floor(Math.random() * dic.length)];
	log('Potato', level.info, string);
}