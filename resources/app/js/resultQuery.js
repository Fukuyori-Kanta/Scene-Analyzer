const mysql = require( 'mysql' );

class DataBase {
    constructor(mysql_setting) {
        this.connection = mysql.createConnection(mysql_setting);
    }
    // 問い合わせ
    query(sql, args) {
        return new Promise(function(resolve, reject) {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        }.bind(this));
    }
    // 接続終了
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}

module.exports = DataBase;