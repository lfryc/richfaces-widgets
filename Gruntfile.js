/*global module:false*/


module.exports = function (grunt) {
  "use strict";
  var path = require("path");
  var mountFolder = function (connect, dir) {
    return connect.static(path.resolve(dir));
  };

  var configuration = {
    pkg: grunt.file.readJSON("package.json"),
    dir: {
      src: {
        root: "src",
        demos: "<%= config.dir.src.root %>/demos",
        widgets: "<%= config.dir.src.root %>/widgets"
      },
      dist: {
        root: "dist",
        assets: "<%= config.dir.dist.root %>/assets",
        demos: "<%= config.dir.dist.root %>/demos",
        flot: "<%= config.dir.dist.assets %>/flot",
        font: "<%= config.dir.dist.assets %>/font-awesome/font",
        richwidgets: "<%= config.dir.dist.assets %>/richwidgets"
      },
      test: {
        root: "test"
      },
      lib: {
        root: "lib",
        bootstrap: "<%= config.dir.lib.root %>/bootstrap",
        fontawesome: "<%= config.dir.lib.root %>/font-awesome",
        jquery: "<%= config.dir.lib.root %>/jquery",
        jqueryui: "<%= config.dir.lib.root %>/jquery-ui",
        flot: {
              lib: "<%= config.dir.lib.root %>/flot",
              axisLabels: "<%= config.dir.lib.root %>/flotAxisLabels",
              orderBars: "<%= config.dir.lib.root %>/flotOrderBars",
              tooltip :  "<%= config.dir.lib.root %>/flotTooltip"
          }
      }
    },
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
  };

  grunt.registerTask("bower", [
    "shell:bowerInstall"
  ]);

  grunt.registerTask("build", [
    "jshint:widgets",
    "jshint:tests",
    "copy:font",
    "copy:jquery",
    "copy:jqueryui",
    "copy:flot",
    "copy:js",
    "less:bootstrap",
    "less:fontawesome",
    "less:widgets",
    "less:dist",
    "concat:flot",
    "uglify:dist"
  ]);

  grunt.registerTask("default", [
    "dist"
  ]);

  grunt.registerTask("dist", [
    "clean:dist",
    "build",
    "copy:demoAssets",
    "uglify:demo",
    "cssmin:demo",
    "assemble:production",
    "test"
  ]);

  grunt.registerTask("test", [
    "karma:test"
  ]);

  grunt.registerTask("travis", [
    "dist"
  ]);

  grunt.registerTask("dev", [
    "clean:demo",
    "build",
    "copy:demoAssets",
    "assemble:dev",
    "connect:dev",
    "watch"
  ]);

  grunt.initConfig({
    config: configuration,
    demo: grunt.file.readYAML('src/demos/data/site.yml'),

    clean: {
      dist: [ '<%= config.dir.dist.root %>' ],
      demo: ['<%= demo.destination %>/**/*.{html,md}']
    },

    less: {
      bootstrap: {
        options: {
          paths: ["<%= config.dir.lib.bootstrap %>/less"]
        },
        src: "<%= config.dir.lib.bootstrap %>/less/bootstrap.less",
        dest: "<%= config.dir.dist.assets %>/bootstrap/bootstrap.css"
      },
      fontawesome: {
        options: {
          paths: ["<%= config.dir.lib.fontawesome %>/less"]
        },
        src: "<%= config.dir.src.widgets %>/font-awesome-richwidgets.less",
        dest: "<%= config.dir.dist.assets %>/font-awesome/font-awesome.css"
      },
      widgets: {
        options: {
          paths: ["<%= config.dir.src.widgets %>", "<%= config.dir.lib.root %>"]
        },
        files: grunt.file.expandMapping("*/**/*.less", "<%= config.dir.dist.richwidgets %>/", { // */**/*.less: exclude files in the widgets folder itself
          cwd: "src/widgets",
          rename: function (destBase, destPath) {
            return destBase + destPath.replace(/\.less$/, '.css');
          }
        })
      },
      dist: {
        options: {
          paths: ["<%= config.dir.src.widgets %>", "<%= config.dir.lib.root %>"],
          yuicompress: true
        },
        src: "<%= config.dir.src.widgets %>/main.less",
        dest: "<%= config.dir.dist.richwidgets %>/richwidgets.min.css"
      }
    },

    cssmin: {
      demo: {
        files: {
          "<%= config.dir.dist.demos %>/assets-demo/richwidgets-demo.min.css": ["<%= config.dir.dist.richwidgets %>/richwidgets.min.css", "<%= config.dir.dist.assets %>/font-awesome/font-awesome.css"]
        }
      }
    },

    uglify: {
      options: {
        banner: "// JBoss RedHat (c)\n"
      },
      dist: {
        options: {
          compress: true
        },
        files: [
          {
            "<%= config.dir.dist.assets %>/richwidgets/richwidgets.min.js": ["<%= config.dir.dist.flot %>/richwidgets.flot.js", "<%= config.dir.src.widgets %>/**/*.js"]
          }
        ]
      },
      demo: {
        options: {
          compress: true,
          nonull: true
        },
        files: [
          {
            "<%= config.dir.dist.demos %>/assets-demo/richwidgets-demo.min.js":
              [
                "<%= config.dir.dist.assets %>/jquery/jquery.min.js",
                "<%= config.dir.dist.assets %>/jquery-ui/minified/jquery-ui.min.js",
                "<%= config.dir.dist.flot %>/richwidgets.flot.js",
                "<%= config.dir.dist.richwidgets %>/richwidgets.min.js"
              ]
          }
        ]
      }
    },

    concat: {
      flot: {
        options: {
          separator: ';',
          nonull: true
        },
        src: [
            "<%= config.dir.dist.flot %>/jquery.flot.js",
            "<%= config.dir.dist.flot %>/jquery.flot.selection.js",
            "<%= config.dir.dist.flot %>/jquery.flot.pie.js",
            "<%= config.dir.dist.flot %>/jquery.flot.categories.js",
            "<%= config.dir.dist.flot %>/jquery.flot.symbol.js",
            "<%= config.dir.dist.flot %>/jquery.flot.tooltip.js",
            "<%= config.dir.dist.flot %>/jquery.flot.orderBars.js"],
        dest: "<%= config.dir.dist.flot %>/richwidgets.flot.js"
      }
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: 'nofunc',
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
//        unused: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      gruntfile: {
        options: {
          globals: {
            jQuery: true,
            require: true
          }
        },
        src: 'Gruntfile.js'
      },
      widgets: {
        options: {
          globals: {
            jQuery: true
          }
        },
        src: ['src/widgets/**/*.js']
      },
      demos: {
        options: {
          globals: {
            '$': true,
            module: true,
            require: true
          }
        },
        src: ['src/demos/**/*.js']
      },
      tests: {
        options: {
          globals: {
            jQuery: true,
            '$': true,
            it: true,
            expect: true,
            runs: true,
            waitsFor: true,
            beforeEach: true,
            afterEach: true,
            define: true,
            describe: true,
            jasmine: true,
            requirejs: true
          }
        },
        src: ['test/**/*.js']
      }
    },

    copy: {
      font: {
        files: [
          {
            expand: true,
            cwd: "<%= config.dir.lib.fontawesome %>/font",
            src: ["**"],
            dest: "<%= config.dir.dist.font %>"
          }
        ]
      },
      jquery: {
        files: [
          {
            expand: true,
            cwd: "<%= config.dir.lib.jquery %>",
            src: ["*.js", "*.map"],
            dest: "<%= config.dir.dist.assets %>/jquery"
          }
        ]
      },
      jqueryui: {
        files: [
          {
            expand: true,
            cwd: "<%= config.dir.lib.jqueryui %>/ui",
            src: ["**"],
            dest: "<%= config.dir.dist.assets %>/jquery-ui"
          }
        ]
      },
      flot: {
            files: [
                {
                    expand: true,
                    cwd: "<%= config.dir.lib.flot.lib %>",
                    src: ['**.js','!**/examples/**','!jquery.js'],
                    dest: "<%= config.dir.dist.assets %>/flot"
                },
                {
                    expand: true,
                    cwd: "<%= config.dir.lib.flot.axisLabels %>",
                    src: ["**.js"],
                    dest: "<%= config.dir.dist.assets %>/flot"
                },
                {
                    expand: true,
                    cwd: "<%= config.dir.lib.flot.orderBars %>/js",
                    src: ["**.js"],
                    dest: "<%= config.dir.dist.assets %>/flot"
                },
                {
                    expand: true,
                    cwd: "<%= config.dir.lib.flot.tooltip %>/js",
                    src: ["**.js","!jquery.flot.js"],
                    dest: "<%= config.dir.dist.assets %>/flot"
                }
            ]
        },
      js: {
        files: grunt.file.expandMapping("**/*.js", "<%= config.dir.dist.richwidgets %>/", {
          cwd: "src/widgets",
          rename: function (destBase, destPath) {
            return destBase + destPath;
          }
        })
      },
      demoAssets: {
        options: {
          banner: '<%= banner %>'
        },
        files: [
          {
            expand: true,
            cwd: "<%= config.dir.lib.root %>",
            src: [
              "modernizr/modernizr.js",
              "highlightjs/highlight.pack.js",
              "highlightjs/styles/github.css",
              "bootstrap/js/dropdown.js",
              "bootstrap/js/collapse.js"
            ],
            dest: "<%= config.dir.dist.demos %>/assets-demo/"
          },
          {
            expand: true,
            cwd: "<%= config.dir.dist.font %>",
            src: "*",
            dest: "<%= config.dir.dist.demos %>/assets-demo/font/"
          },
          {
            expand: true,
            cwd: "<%= config.dir.src.demos %>/pages",
            src: ["**/*.{css,js}"],
            dest: "<%= config.dir.dist.demos %>/assets-demo/"
          }
        ]
      }
    },

    shell: {
      options: {
        stdout: true
      },
      bowerInstall: {
        command: "bower install"
      }
    },

    parallel: {
      options: {
        grunt: true
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      test: {
        singleRun: true,
        autoWatch: false
      },
      auto: {
        autoWatch: true
      }
    },

    watch: {
      options: {
        livereload: false,
        forever: true
      },
      less: {
        files: ["<%= config.dir.src.widgets %>/**/*.less"],
        tasks: ["less:widgets"]
      },
      js: {
        files: ["<%= config.dir.src.widgets %>/**/*.js"],
        tasks: ["copy:js"]
      },
      demo: {
        files: [
          "<%= config.dir.src.demos %>/**",
          "README.md",
          "CONTRIBUTING.md"
        ],
        tasks: ["copy:demoAssets", "assemble:dev"]
      },
      dist: {
        options: {
          livereload: true
        },
        files: [
          "<%= config.dir.dist.assets %>/**/*.js",
          "<%= config.dir.dist.assets %>/**/*.css",
          "<%= config.dir.dist.demos %>/**/*.html"
        ],
        tasks: []
      }
    },

    connect: {
      options: {
        port: 9000,
        // change this to '0.0.0.0' to access the server from outside
        //hostname: 'localhost'
        hostname: '0.0.0.0'
      },
      demo: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, 'dist/demos')
            ];
          }
        }
      },
      dev: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, 'dist/demos'),
              mountFolder(connect, 'dist')
            ];
          }
        }
      }
    },

    assemble: {
      options: {
        prettify: {indent: 2},
        data: 'src/demos/**/*.{json,yml}',
        assets: './dist/demos/assets',
        helpers: ['src/demos/helpers/helper-*.js', 'node_modules/yfm/lib/*.js'],
        layoutdir: 'src/demos/templates/layouts',
        layout: 'default.hbs',
        partials: ['src/demos/templates/includes/**/*.hbs']
      },
      production: {
        options: {production: true},
        files: [
          { expand: true, cwd: 'src/demos/pages', src: ['**/*.hbs'], dest: '<%= demo.destination %>/' }
        ]
      },
      dev: {
        options: {production: false},
        files: [
          { expand: true, cwd: 'src/demos/pages', src: ['**/*.hbs'], dest: '<%= demo.destination %>/' }
        ]
      }
    },

    'gh-pages': {
      options: {
        base: 'dist/demos',
        branch: 'master',
        repo: 'git@github.com:richwidgets/richwidgets.github.io.git'
      },
      src: ['**']
    }
  });

  // load all the grunt-* dependencies found in the package.json file
  require("matchdep").filterDev("grunt-*").forEach(function (plugin) {
    grunt.loadNpmTasks(plugin);
  });

  grunt.loadNpmTasks('assemble');
  grunt.loadNpmTasks('assemble-less');  // not related to assemble
};
