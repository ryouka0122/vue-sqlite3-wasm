import { SqliteDriver } from "@/sqlite3";
import type { isDeleteExpression } from "typescript";

type UserInfoEntity = {
  USER_ID: number,
  NAME: string,
  AGE: number,
  GENDER: string,
}


class UserInfoClient {
  driver: SqliteDriver;

  constructor(driver: SqliteDriver) {
    this.driver = driver;
  }

  initialize() {
    return this.driver.exec({
      sql: `CREATE TABLE IF NOT EXISTS USER_INFO(
                  USER_ID INTEGER PRIMARY KEY,
                  NAME TEXT NOT NULL,
                  AGE INTEGER NOT NULL,
                  GENDER TEXT NOT NULL
              )`
    })
  }

  async selectAll() {
    const selectResult = [] as UserInfoEntity[];
    await this.driver.exec<UserInfoEntity>({
      sql: `SELECT * FROM USER_INFO ORDER BY USER_ID ASC`,
      callback: (row) => {
        selectResult.push(row.record)
      }
    })
    return selectResult;
  }

  insert(name: string, age: number, gender: string) {
    return this.driver.exec({
      sql: `INSERT INTO USER_INFO(NAME, AGE, GENDER) VALUES (?, ?, ?)`,
      bind: [name, age, gender],
    })
  }

  update(userId: number, name: string, age: number, gender: string) {
    return this.driver.exec({
      sql: `UPDATE USER_INFO SET
                NAME = ?,
                AGE = ?,
                GENDER = ?
            WHERE USER_ID = ?`,
      bind: [name, age, gender, userId],
    })
  }

  delete(userId: number) {
    return this.driver.exec({
      sql: `DELETE FROM USER_INFO WHERE USER_ID = ?`,
      bind: [userId]
    })
  }

  truncateTable() {
    return this.driver.exec({
      sql: `DELETE FROM USER_INFO`
    })
  }

  async getLastUserId() {
    let lastUserId = 0
    await this.driver.exec<{
      LAST_USER_ID: number
    }>({
      sql: `SELECT max(USER_ID) as LAST_USER_ID FROM USER_INFO`,
      callback: (row) => {
        lastUserId = row.record.LAST_USER_ID
      }
    })
    return lastUserId
  }

}

export {
  UserInfoClient,
  type UserInfoEntity
}