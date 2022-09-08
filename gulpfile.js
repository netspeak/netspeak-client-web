const { simpleGit } = require("simple-git");
const sh = require("shelljs");

async function publishDemo() {
	sh.cd(__dirname);

	console.log("Cloning remote repository");

	sh.rm("-rf", "publish");
	sh.exec("git clone https://github.com/netspeak/netspeak.github.io.git publish");
	const repo = simpleGit(__dirname + "/publish");
	await repo.status(); // verify repo

	sh.exec("npm run clean");
	sh.exec("npm run build:demo");

	sh.rm("-rf", "publish/demo");
	sh.mkdir("-p", "publish/demo");
	sh.cp("-r", "./public/*", "./publish/demo");

	const status = await repo.status();

	if (status.files.length === 0) {
		console.log("Nothing changed. No commit will be made.");
		return;
	}

	console.log("Commit and push");

	await repo.add("*");
	await repo.commit("Published demo");
	await repo.push();
}

async function publishRelease() {
	sh.cd(__dirname);

	console.log("Cloning remote repository");

	sh.rm("-rf", "publish");
	sh.exec("git clone https://github.com/netspeak/netspeak.github.io.git publish");
	const repo = simpleGit(__dirname + "/publish");
	await repo.status(); // verify repo

	sh.exec("npm run clean");
	sh.exec("npm run build");

	sh.cd("./publish");
	sh.ls().forEach(file => {
		if (!/^(?:\.git|\.nojekyll|demo|CNAME)$/i.test(file)) {
			sh.rm("-rf", file);
		}
	});
	sh.cd("..");
	sh.cp("-r", "./public/*", "./publish");

	const status = await repo.status();

	if (status.files.length === 0) {
		console.log("Nothing changed. No commit will be made.");
		return;
	}

	console.log("Commit and push");

	await repo.add("*");
	await repo.commit("Published release");
	await repo.push();
}

module.exports = {
	publishDemo,
	publishRelease,
};
