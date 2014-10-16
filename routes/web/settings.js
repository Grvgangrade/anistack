var hAuth = require('../../helpers/auth');

module.exports = function(app){
	app.route('/me/settings/:tab(basic|avatar|password|privacy)?')
	.all(hAuth.ifAuth)
	.get(function(req, res, next){
		res.render('settings', {
			tab: req.param('tab')
		});
	});
}