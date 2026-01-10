const db = require('./database')

function incrementCounter(userId, amount) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // global
      db.run(
        `UPDATE counter SET total = total + ? WHERE id = 1`,
        [amount],
        err => {
          if (err) return reject(err)
        }
      )

      // usuário (cria se não existir)
      db.run(
        `
        INSERT INTO user_counter (user_id, total)
        VALUES (?, ?)
        ON CONFLICT(user_id)
        DO UPDATE SET total = total + excluded.total
        `,
        [userId, amount],
        err => {
          if (err) return reject(err)

          // retorna totais
          db.get(
            `SELECT total FROM counter WHERE id = 1`,
            (err, globalRow) => {
              if (err) return reject(err)

              db.get(
                `SELECT total FROM user_counter WHERE user_id = ?`,
                [userId],
                (err, userRow) => {
                  if (err) return reject(err)

                  resolve({
                    global: globalRow.total,
                    user: userRow.total
                  })
                }
              )
            }
          )
        }
      )
    })
  })
}


function getTotal() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT total FROM counter WHERE id = 1`,
      (err, row) => {
        if (err) return reject(err)
        resolve(row.total)
      }
    )
  })
}

function resetDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`UPDATE counter SET total = 0 WHERE id = 1`)
      db.run(`DELETE FROM user_counter`, err => {
        if (err) return reject(err)
        resolve()
      })
    })
  })
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id, total FROM user_counter`,
      (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      }
    )
  })
}

function getUser(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT user_id, total FROM user_counter WHERE user_id = ?`,
      [userId],
      (err, row) => {
        if (err) return reject(err)
        resolve(row || null)
      }
    )
  })
}

function getRanking() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id, total, name
       FROM user_counter 
       ORDER BY total DESC`,
      (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      }
    )
  })
}

module.exports = {
  incrementCounter,
  getTotal,
  resetDatabase,
  getAllUsers,
  getRanking,
  getUser
}
