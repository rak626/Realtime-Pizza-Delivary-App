let mix = require('laravel-mix');
mix.disableNotifications();

mix.js('resources/js/app.js', 'public/js/app.js').sass(
    'resources/scss/app.scss',
    'public/css/app.css'
);

mix.minify(['public/js/app.js', 'public/css/app.css']);
