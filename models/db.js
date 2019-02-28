'use strict';

hello

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var slugin = require('slugin');
var bcryptjs = require('bcryptjs');
var _ = require('lodash');
var request = require('request');

var mongooseValidateFilter = require('mongoose-validatefilter');

if (process.env.NODE_ENV !== 'test') {
	mongoose.connect('mongodb://127.0.0.1:' + process.env.DB_PORT + '/' + process.env.DB_NAME, {
		user: process.env.DB_USERNAME,
		pass: process.env.DB_PASSWORD
	});
}

var validators = {
	anime: new mongooseValidateFilter.validate(),
	manga: new mongooseValidateFilter.validate(),
	user: new mongooseValidateFilter.validate(),
	list: new mongooseValidateFilter.validate()
}

var filters = {
	anime: new mongooseValidateFilter.filter(),
	manga: new mongooseValidateFilter.filter(),
	user: new mongooseValidateFilter.filter(),
	list: new mongooseValidateFilter.filter()
}

var filter = {
	anime: {
		allowedGenres: [
			'action', 'adventure', 'comedy',
			'demons', 'drama', 'ecchi',
			'fantasy', 'game', 'harem',
			'hentai', 'historical', 'horror',
			'josei', 'kids', 'magic',
			'martial arts', 'mecha', 'military',
			'music', 'mystery', 'parody',
			'police', 'psychological', 'romance',
			'samurai', 'school', 'sci-fi',
			'seinen', 'shoujo', 'shoujo ai',
			'shounen', 'shounen ai', 'slice of life',
			'space', 'sports', 'super power',
			'supernatural', 'thriller', 'campire',
			'yaoi', 'yuri'
		],
		allowedRelations: [
			'adaptation',
			'parent story',
			'prequel',
			'sequel',
			'side story',
			'summary',
			'other'
		],
		date: function(dateString, done) {
			if (Date.parse(dateString) !== 0) {
				done(dateString);
			} else {
				done(null);
			}
		},
		genres: function(genreArr, done) {
			done(_.intersection(genreArr, filter.anime.allowedGenres));
		},
		related: function(relatedArr, done) {
			if (!relatedArr.length) return done([]);

			var tempRelatedArr = relatedArr;

			for (var i = 0; i < tempRelatedArr.length; i++) {
				tempRelatedArr[i].relation = tempRelatedArr[i].relation.toLowerCase();
			}

			done(tempRelatedArr);
		}
	},
	user: {
		password: function(passwordStr, done) {
			bcryptjs.hash(passwordStr, 8, function(err, hash) {
				if (err) throw new Error('bcrypt hash failed');
				return done(hash);
			});
		}
	},
	general: {
		lowerCaseUniq: function(arr, done) {
			if (arr.length) {
				arr = _.uniq(arr.map(function(item) {
					return item.toLowerCase();
				}));
				done(arr);
			} else {
				done([]);
			}
		},
		uniq: function(arr, done) {
			if (arr.length) {
				arr = _.uniq(arr);
				done(arr);
			} else {
				done([]);
			}
		}
	}
}

var validate = {
	anime: {
		type: function(typeStr, done) {
			typeStr = typeStr.toLowerCase();
			if (['tv', 'ova', 'ona', 'movie', 'special', 'music'].indexOf(typeStr) > -1) {
				done(true);
			} else {
				done(false);
			}
		},
		status: function(statusStr, done) {
			if (!statusStr) return done(true);
			statusStr = statusStr.toLowerCase();
			if (['finished', 'ongoing', 'upcoming'].indexOf(statusStr) > -1) {
				done(true);
			} else {
				done(false);
			}
		}
	},
	manga: {
		type: function(typeStr, done) {
			typeStr = typeStr.toLowerCase();
			if (['manga', 'novel', 'oneshot', 'doujin', 'manhwa', 'manhua', 'oel'].indexOf(typeStr) > -1) {
				done(true);
			} else {
				done(false);
			}	
		}
	},
	user: {
		username: function(usernameStr, done) {

			// Check if username only includes letters/numbers
			if (/^\w+$/g.test(usernameStr)) return done(false); 
			this.findOne({
				username: new RegExp('^' + usernameStr + '$', 'i')
			}, function(err, doc) {
				if (err) return done(false);
				return done(!doc);
			});
		},
		email: function(emailStr, done) {
			if (!emailStr) return done(true);

			// This validation method also exists in /routes/user.js. Not very DRY, but still acceptable
			request('https://api.mailgun.net/v2/address/validate?api_key=' + process.env.MAILGUN_PUBKEY + '&address=' + emailStr, function(err, response, body) {
				body = JSON.parse(body);
				if (!body.is_valid) return done(false);
				this.findOne({
					email: emailStr.toLowerCase()
				}, function(err, userDoc) {
					if (err) return done(false);
					return done(!userDoc);
				});
			}.bind(this));
		}
	},
	list: {
		anime: function(_animeId, done) {
			done(false);
		},
		status: function(statusStr, done) {
			statusStr = statusStr.toLowerCase();
			if (['current', 'completed', 'planned', 'onhold', 'dropped'].indexOf(statusStr) > -1) {
				done(true);
			} else {
				done(false);
			}
		}
	}
}

// Validation/Filtering for AnimeSchema
validators.anime.add('series_type', {
	callback: validate.anime.type,
	msg: 'series_type did not pass validation'
});

validators.anime.add('series_episodes_total', {
	min: 0,
	max: 999,
	msg: 'series_episodes_total did not pass validation'
});

validators.anime.add('series_status', {
	callback: validate.anime.status,
	msg: 'series_status did not pass validation'
});

filters.anime.add('series_type', 'lowercase');
filters.anime.add('series_status', 'lowercase');
filters.anime.add('series_genres', filter.general.lowerCaseUniq);
filters.anime.add('series_genres', filter.anime.genres);
filters.anime.add('series_related', filter.anime.related);
filters.anime.add('series_similar', filter.general.uniq);

// Validation/Filtering for MangaSchema
validators.manga.add('series_type', {
	callback: validate.manga.type,
	msg: 'series_type did not pass validation'
});

validators.manga.add('series_status', {
	callback: validate.anime.status,
	msg: 'series_status did not pass validation'
});

filters.manga.add('series_type', 'lowercase');
filters.manga.add('series_genres', filter.general.lowerCaseUniq);
filters.manga.add('series_genres', filter.anime.genres);
filters.manga.add('series_related', filter.anime.related);
filters.manga.add('series_similar', filter.general.uniq);

// Validation/Filtering for UserSchema
validators.user.add('display_name', {
	minLength: 3,
	maxLength: 40,
	msg: 'display_name did not pass validation'
});

validators.user.add('username', {
	minLength: 3,
	maxLength: 40,
	callback: validate.user.username,
	msg: 'username did not pass validation'
});

validators.user.add('password', {
	minLength: 6,
	msg: 'password did not pass validation'
});

validators.user.add('email', {
	callback: validate.user.email,
	msg: 'email did not pass validation'
});

filters.user.add('username', 'lowercase');
filters.user.add('email', 'lowercase');
filters.user.add('password', filter.user.password);

// Schemas

var AnimeSchema = new Schema({
	series_title_main: {
		type: String,
		required: true,
		index: true
	},
	series_title_english: {
		type: String,
		index: true
	},
	series_title_synonyms: [{
		type: String,
	 	index: true
	}],
	series_title_japanese: String,
	series_slug: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	series_type: {
		type: String,
		lowercase: true,
		enum: ['tv', 'ova', 'ona', 'movie', 'special', 'music'],
		required: true
	},
	series_status: {
		type: String,
		lowercase: true,
		enum: ['finished', 'ongoing', 'upcoming']
	},
	series_date_start: Date,
	series_date_end: Date,
	series_synopsis: String,
	series_episodes_total: {
		type: Number,
		min: 0,
		max: 9999,
		required: true
	},
	series_episodes_duration: Number,
	series_episodes: [{
		_id: false,
		episode_number: Number,
		episode_title: String,
		episode_urls: [ String ]
	}],
	series_image_reference: String,
	series_image_poster: String,
	series_image_cover: String,
	series_genres: [ String ],
	series_gallery: [ String ],
	series_producer: [ Schema.Types.ObjectId ],
	series_external_ids: {
		myanimelist: {
			type: Number,
			unique: true
		}
	},
	series_external_links: [{
		_id: false,
		title: String,
		url: String
	}],
	series_related: [{
		_id: false,
		relation: {
			type: String,
			lowercase: true
		},
		relation_collection: String, // Either anime or manga
		myanimelist: Number
	}],
	series_similar: [ Number ]
});

AnimeSchema.plugin(slugin, {
	slugName: 'series_slug',
	source: [
		'series_title_main'
	]
});

var MangaSchema = new Schema({
	series_title_main: {
		type: String,
		required: true,
		index: true
	},
	series_title_english: {
		type: String,
		index: true
	},
	series_title_synonyms: [{
		type: String,
	 	index: true
	}],
	series_title_japanese: String,
	series_slug: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	series_type: {
		type: String,
		lowercase: true,
		enum: ['manga', 'novel', 'oneshot', 'doujin', 'manhwa', 'manhua', 'oel'],
		required: true
	},
	series_status: {
		type: String,
		lowercase: true,
		enum: ['finished', 'ongoing', 'upcoming']
	},
	series_date_start: Date,
	series_date_end: Date,
	series_synopsis: String,
	series_image_reference: String,
	series_image_poster: String,
	series_image_cover: String,
	series_genres: [ String ],
	series_gallery: [ String ],
	series_producer: [ Schema.Types.ObjectId ],
	series_external_ids: {
		myanimelist: {
			type: Number,
			unique: true
		},
		anidb: Number
	},
	series_external_links: [{
		_id: false,
		title: String,
		url: String
	}],
	series_related: [{
		_id: false,
		relation: {
			type: String,
			lowercase: true
		},
		relation_collection: String, // Either anime or manga
		myanimelist: Number
	}],
	series_similar: [ Number ]
});

MangaSchema.plugin(slugin, {
	slugName: 'series_slug',
	source: [
		'series_title_main'
	]
});

var ProducerSchema = new Schema({
	producer_title: {
		type: String,
		required: true
	},
	producer_image_original: String,
	producer_image_processed: String,
	producer_description: String,

	// Does the "producer" actually produce anime, or do they just purchase rights to distribute?
	producer_animates: Boolean
});

var AnimeListItemSchema = new Schema({
	_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	item_progress: {
		type: Number,
		min: 0,
		max: 9999,
		default: 0
	},
	item_rating: {
		type: Number,
		min: 0,
		max: 10,
		default: 0
	},
	item_status: {
		type: String,
		enum: ['current', 'completed', 'planned', 'onhold', 'dropped'],
		required: true
	},
	item_repeats: {
		type: Number,
		min: 0,
		max: 999,
		default: 0
	}
});

var MangaListItemSchema = new Schema({
	_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	item_progress: {
		type: Number,
		min: 0,
		max: 9999,
		default: 0
	},
	item_rating: {
		type: Number,
		min: 0,
		max: 10,
		default: 0
	},
	item_status: {
		type: String,
		enum: ['current', 'completed', 'planned', 'onhold', 'dropped'],
		required: true
	},
	item_repeats: {
		type: Number,
		min: 0,
		max: 999,
		default: 0
	}
});

var ActivityItemSchema = new Schema({

	// Modified version of the ActivityStreams 2.0 Schema
	verb: {
		type: String,
		lowercase: true,
		required: true
	},
	published: {
		type: Date,
		default: Date.now
	},
	actor: {
		objectType: {
			type: String,
			required: true
		},
		_id: {
			type: Schema.Types.ObjectId,
			required: true
		},
		display_name: {
			type: String,
			required: true
		},
		url: {
			type: String,
			required: true
		},
		image: String // For user avatars
	},
	object: {
		objectType: {
			type: String,
			required: true
		},
		_id: {
			type: Schema.Types.ObjectId,
			required: true
		},
		display_name: {
			type: String,
			required: true
		},
		url: {
			type: String,
			required: true
		}
	},
	target: {
		objectType: {
			type: String,
			required: true
		},
		_id: {
			type: Schema.Types.ObjectId,
			required: true
		},
		display_name: {
			type: String,
			required: true
		},
		url: {
			type: String,
			required: true
		}
	}
});

var StackItemSchema = new Schema({
	_id: Schema.Types.ObjectId,
	stack_title: {
		required: true,
		type: String
	},
	stack_series: [{
		_id: {
			type: Schema.Types.ObjectId,
			required: true
		},
		type: String // Either anime or manga
	}]
});

var UserSchema = new Schema({
	display_name: {
		type: String,
		required: true,
		unique: true
	},
	// Username should always be lowercase
	username: {
		type: String,
		required: true,
		lowercase: true,
		unique: true
	},
	email: {
		type: String,
		lowercase: true,
		unique: true
	},
	avatar: {
		processed: {
			type: String,
			default: ''
		},
		original: {
			type: String,
			default: ''
		}
	},
	password: {
		type: String,
		required: true
	},
	biography: {
		type: String
	},
	settings: {
		stats_private: {
			type: Boolean,
			default: false
		},
		anime_list_private: {
			type: Boolean,
			default: false
		},
		manga_list_private: {
			type: Boolean,
			default: false
		},
		stacks_private: {
			type: Boolean,
			default: false
		},
		series_show_cover: {
			type: Boolean,
			default: true
		}
	},
	anime_list: [ AnimeListItemSchema ],
	manga_list: [ MangaListItemSchema ],
	stacks: [ StackItemSchema ],
	activity_feed: [ ActivityItemSchema ],
	api_token: String,
	reset_pass_token: String
});

mongooseValidateFilter.validateFilter(AnimeSchema, validators.anime, filters.anime);
mongooseValidateFilter.validateFilter(MangaSchema, validators.manga, filters.manga);
mongooseValidateFilter.validateFilter(UserSchema, validators.user, filters.user);

AnimeSchema.index({
	series_title_main: 'text',
	series_title_english: 'text',
	series_title_synonyms: 'text'
}, {
	weights: {
		series_title_main: 4,
		series_title_english: 3,
		series_title_synonyms: 1
	}
});

MangaSchema.index({
	series_title_main: 'text',
	series_title_english: 'text',
	series_title_synonyms: 'text'
}, {
	weights: {
		series_title_main: 4,
		series_title_english: 3,
		series_title_synonyms: 1
	}
});

var Anime = mongoose.model('Anime', AnimeSchema);
var Manga = mongoose.model('Manga', MangaSchema);
var User = mongoose.model('User', UserSchema);

module.exports = {
	Anime: Anime,
	Manga: Manga,
	User: User
}