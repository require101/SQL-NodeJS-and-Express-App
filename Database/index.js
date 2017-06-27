var knex = require('knex')({
    client: 'mssql',
    connection: {
        host: 'localhost',
        port: 51426,
        instanceName: 'SQLEXPRESS',
        user: 'user',
        password: '123qwe',
        database: 'users',
    }
});

var bookshelf = require('bookshelf')(knex);

exports.__bookshelf = bookshelf;