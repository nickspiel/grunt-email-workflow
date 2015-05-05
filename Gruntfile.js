module.exports = function(grunt) {

		grunt.initConfig({

			pkg: grunt.file.readJSON('package.json'),
			secrets: grunt.file.readJSON('secrets.json'),

			paths: {
				src:        'src',
				src_img:    'src/images',
				dist:       'dist',
				dist_img:   'dist/images'
			},

			sass: {
				dist: {
					options: {
						style: 'expanded'
					},
					files: {
						'<%= paths.src %>/css/main.css': '<%= paths.src %>/css/scss/main.scss'
					}
				}
			},

			assemble: {
				options: {
					layoutdir: '<%= paths.src %>/layouts',
					partials: ['<%= paths.src %>/partials/**/*.hbs'],
					data: ['<%= paths.src %>/data/*.{json,yml}'],
					flatten: true
				},
				pages: {
					src: ['<%= paths.src %>/emails/*.hbs'],
					dest: '<%= paths.dist %>/'
				}
			},

			// Replace compiled template images sources from ../src/html to ../dist/html
			replace: {
				clean: {
					options: {
						usePrefix: false,
						patterns: [
							{
								// Strip extra padding and spacing from all tables
								match: /(<table)/gi,
								replacement: '$1 cellpadding="0" cellspacing="0"'
							},
							{
								// Remove link tags 
								match: /<link.*\/>/gi,
								replacement: ''
							}
						]
					},
					files: [{
						expand: true,
						flatten: true,
						src: ['<%= paths.dist %>/*.html'],
						dest: '<%= paths.dist %>'
					}]
				}
			},

			premailer: {
				html: {
					options: {
						removeComments: false,
						preserveStyles: true
					},
					files: [{
							expand: true,
							src: ['<%= paths.dist %>/*.html'],
							dest: ''
					}]
				},
				txt: {
					options: {
						mode: 'txt'
					},
					files: [
						{
							expand: true,
							src: ['<%= paths.dist %>/*.html'],
							dest: '',
							ext: '.txt'
						}
					]
				}
			},

			// Optimize images
			imagemin: {
				dynamic: {
					options: {
						optimizationLevel: 3,
						svgoPlugins: [{ removeViewBox: false }]
					},
					files: [{
						expand: true,
						cwd: '<%= paths.src_img %>',
						src: ['**/*.{png,jpg,gif}'],
						dest: '<%= paths.dist_img %>'
					}]
				}
			},

			// Watches for changes to css or email templates then runs grunt tasks
			watch: {
				files: ['<%= paths.src %>/css/scss/*','<%= paths.src %>/emails/*','<%= paths.src %>/layouts/*','<%= paths.src %>/partials/*','<%= paths.src %>/data/*'],
				tasks: ['default'],
				options: {
					livereload: true,
					spawn: true
				}
			},

			// grunt send --template=transaction.html
			mailgun: {
				mailer: {
					options: {
						key: '<%= secrets.mailgun.api_key %>',
						sender: '<%= secrets.mailgun.sender %>',
						recipient: '<%= secrets.mailgun.recipient %>',
						subject: 'This is a test email'
					},
					src: ['<%= paths.dist %>/'+grunt.option('template')]
				}
			},

			// grunt litmus --template=spot-specials.html
			litmus: {
				test: {
					src: ['<%= paths.dist %>/'+grunt.option('template')],
					options: {
						username: '<%= secrets.litmus.username %>', // See README for secrets.json or replace this with your username
						password: '<%= secrets.litmus.password %>', // See README for secrets.json or replace this with your password
						url: 'https://<%= secrets.litmus.company %>.litmus.com', // See README for secrets.json or replace this with your company url
						clients: ['android4', 'androidgmailapp', 'appmail6', 'iphone6', 'ipadmini', 'ipad', 'chromegmailnew',
						'iphone6plus', 'ol2002', 'ol2003', 'ol2007', 'ol2010', 'ol2011',
						'ol2013', 'chromeoutlookcom', 'chromeyahoo', 'windowsphone8'] // https://#{company}.litmus.com/emails/clients.xml
					}
				}
			},

			// make a zipfile
			zip: {
				images: {
					cwd: 'dist/',
				    src: ['dist/images/*'],
				    dest: 'dist/images.zip'
				}
			}
		});

		grunt.loadNpmTasks('grunt-contrib-sass');
		grunt.loadNpmTasks('assemble');
		grunt.loadNpmTasks('grunt-mailgun');
		grunt.loadNpmTasks('grunt-premailer');
		grunt.loadNpmTasks('grunt-contrib-watch');
		grunt.loadNpmTasks('grunt-litmus');
		grunt.loadNpmTasks('grunt-contrib-imagemin');
		grunt.loadNpmTasks('grunt-replace');
		grunt.loadNpmTasks('grunt-zip');

		grunt.registerTask('default', ['sass','assemble','premailer','imagemin','replace:clean', 'zip']);

		grunt.registerTask('send', ['mailgun']);

		grunt.registerTask('test', ['mailgun', 'litmus']);
};

// TODO: Email validation
// TODO: Campaign monitor conversion
