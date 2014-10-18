var cx = React.addons.classSet;
var Settings = React.createClass({
	getInitialState: function(){
		return {
			tab: $('#settings').data('tab') || 'basic',
			user: {},
			loaded: false
		};
	},
	componentDidMount: function() {
		$.ajax({
			url: '/api/settings',
			success: function(user){
				this.setState({
					user: user,
					loaded: true
				});
			}.bind(this)
		});
	},
	setTab: function(tabVal){
		this.setState({
			tab: tabVal
		});
	},
	render: function(){
		if(!this.state.loaded) return false;
		return (
			<div>
				<div id="settings-left">
					<div id="settings-hd">
						Settings
					</div>
					<div id="settings-tagline">
						Do not forget to save
					</div>
					<div id="settings-tabs">
						{
							['Basic', 'Password', 'Privacy'].map(function(tabName){
								return (
								<div className={cx({
									'setting-tab': true,
									'current': this.state.tab === tabName.toLowerCase()
								})} onClick={this.setTab.bind(null, tabName.toLowerCase())}>
									{tabName}
								</div>);
							}.bind(this))
						}
					</div>
				</div>
				<div id="settings-right">
					{this.state.tab === 'basic' ? <BasicSettings user={this.state.user} /> : null}
					{this.state.tab === 'password' ? <PasswordSettings user={this.state.user} /> : null}
					{this.state.tab === 'privacy' ? <PrivacySettings user={this.state.user} /> : null}
				</div>
			</div>
		);
	}
});

var BasicSettings = React.createClass({
	componentDidMount: function() {
		$(this.refs.setForm.getDOMNode()).find('>div').stop(true).velocity('herro.slideUpIn', {
			duration: 500,
			stagger: 150
		});
	},
	changeEmail: function(){
		return false;
	},
	render: function(){
		return (
			<div>
				<form className="set-form" ref="setForm">
					<div className="set-section">
						<div className="set-left">
							<div className="set-title">Email address</div>
							<div className="set-desc">Used for account recovery and anime/manga notifications.</div>
						</div>
						<div className="set-right">
							<input className="set-input" name="email" type="text" defaultValue={this.props.user.email} />
						</div>
					</div>
					<div className="set-section">
						<div className="set-left">
							<div className="set-title">Avatar</div>
							<div className="set-desc">
								Simply give us an <a href="http://imgur.com" rel="nofollow" target="_blank">Imgur</a> link to
								your avatar and let us handle the rest.
								<br /><br />
								(Suggested: 250 &times; 250 pixels)
							</div>
						</div>
						<div className="set-right">
							<input
								className="set-input"
								name="avatar"
								type="text"
								placeholder="Imgur link to new avatar..."
							/>
							<div className="set-avatar-preview-wrap">
								<img
									src={this.props.user.avatar ? this.props.user.avatar.processed : 'http://i.imgur.com/siaPoHT.png'}
									className="set-avatar" 
								/>
							</div>
						</div>
					</div>
					<div className="set-section">
						<div className="set-left">
							<div className="set-title">Biography</div>
							<div className="set-desc">Short text about yourself and what you do.</div>
						</div>
						<div className="set-right">
							<textarea className="set-textarea" rows="5" name="biography" type="text">{this.props.user.biography}</textarea>
						</div>
					</div>
				</form>
			</div>
		);
	}
});

var PasswordSettings = React.createClass({
	componentDidMount: function() {
		$(this.refs.setForm.getDOMNode()).find('>div').stop(true).velocity('herro.slideUpIn', {
			duration: 500,
			stagger: 150
		});
	},
	render: function(){
		return (
			<div>
				<form className="set-form" ref="setForm">
					<div className="set-section">
						<div className="set-left">
							<div className="set-title">Old Password</div>
							<div className="set-desc">Just to know that it is you.</div>
						</div>
						<div className="set-right">
							<input className="set-input" name="old_password" type="password" />
						</div>
					</div>
					<div className="set-section">
						<div className="set-left">
							<div className="set-title">New Password</div>
							<div className="set-desc">Make sure you remember this.</div>
						</div>
						<div className="set-right">
							<input className="set-input" name="new_password" type="password" />
						</div>
					</div>
				</form>
			</div>
		)
	}
});

var PrivacySettings = React.createClass({
	getInitialState: function(){
		return {
			lists_private: false,
			collections_private: false,
			stats_private: false
		}
	},
	componentDidMount: function(){
		this.setState(this.props.settings);
		$(this.refs.setForm.getDOMNode()).find('>div').stop(true).velocity('herro.slideUpIn', {
			duration: 500,
			stagger: 150
		});
	},
	toggleCheckbox: function(checkboxVal){
		var checkObj = {};
		console.log(checkboxVal);
		checkObj[checkboxVal] = !this.state[checkboxVal];
		this.setState(checkObj);
	},
	render: function(){
		return (
			<form className="set-form" ref="setForm">
				<div className="set-section">
					<div className="set-left">
						<div className="set-title">Protect List</div>
						<div className="set-desc">Make your lists private.</div>
					</div>
					<div className="set-right">
						<div className={
							cx({
								'set-check': true,
								'private': this.state.lists_private
							})
						}>
							<input type="checkbox" className="set-checkbox" id="lists_private" name="lists_private" checked={this.state.lists_private} onChange={this.toggleCheckbox.bind(null, 'lists_private')} />
							<label className="set-check-label" htmlFor="lists_private">
								{this.state.lists_private ? 'Private' : 'Public'}
							</label>
						</div>
					</div>
				</div>
				<div className="set-section">
					<div className="set-left">
						<div className="set-title">Protect Stats</div>
						<div className="set-desc">Make your stats private.</div>
					</div>
					<div className="set-right">
						<div className={
							cx({
								'set-check': true,
								'private': this.state.stats_private
							})
						}>
							<input type="checkbox" className="set-checkbox" id="stats_private" name="stats_private" checked={this.state.stats_private} onChange={this.toggleCheckbox.bind(null, 'stats_private')} />
							<label className="set-check-label" htmlFor="stats_private">
								{this.state.stats_private ? 'Private' : 'Public'}
							</label>
						</div>
					</div>
				</div>
				<div className="set-section">
					<div className="set-left">
						<div className="set-title">Protect Collections</div>
						<div className="set-desc">Make your collections private.</div>
					</div>
					<div className="set-right">
						<div className={
							cx({
								'set-check': true,
								'private': this.state.collections_private
							})
						}>
							<input type="checkbox" className="set-checkbox" id="collections_private" name="collections_private" checked={this.state.collections_private} onChange={this.toggleCheckbox.bind(null, 'collections_private')} />
							<label className="set-check-label" htmlFor="collections_private">
								{this.state.collections_private ? 'Private' : 'Public'}
							</label>
						</div>
					</div>
				</div>
			</form>
		)
	}
});

module.exports = Settings;