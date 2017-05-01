const myExtension = require('../extension');

suite("Extension Tests", function() {

	test("activate", function() {
		myExtension.activate({ subscriptions: [] });
	});

	test("deactivate", function() {
		myExtension.deactivate();
	});
});