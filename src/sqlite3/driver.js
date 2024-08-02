import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm";

/**
 * Sqlite-WASMを扱うドライバー
 */
class SqliteDriver {
  /* OPFS上で管理するファイル名 */
  db_filename = ""

  /* Sqlite-WASMに渡す際に指定するファイル名 */
  opfs_file_path = ""

  /* Sqlite3WASM Worker1 wrapper */
  worker

  /* database ID */
  dbId

  /**
   *
   * @param filename {string}
   * @returns {Promise<SqliteDriver>}
   */
  static async build(filename) {
    const driver = new SqliteDriver(filename);

    driver.worker = await new Promise((resolve) => {
      const p = sqlite3Worker1Promiser({
        //debug: console.log,
        onready: () => {
          resolve(p);
        },
      });
    });

    console.log("SqliteDriver:initialize:", driver)
    return driver;
  }

  /**
   *
   * @param sqlite_db_file {string}
   */
  constructor (sqlite_db_file) {
    this.db_filename = sqlite_db_file
    this.opfs_file_path = `file:${sqlite_db_file}?vfs=opfs`
  }

  /**
   *
   * @returns Promise<Blob>
   */
  export_data() {
    return this.worker("export", {
      dbId: this.dbId,
    }).then(response => {
      return new Blob([response.result.byteArray], {
        type: "application/x-sqlite3"
      })
    })
  }

  /**
   *
   * @returns {Promise<any>}
   */
  get_config() {
    return this.worker("config-get", {})
  }

  /**
   *
   * @returns {Promise<void>}
   */
  open() {
    return this.worker("open", {
      filename: this.opfs_file_path
    }).then(response => {
      console.log("SqliteDriver:open:", response)
      this.dbId = response.dbId
    })
  }

  exec(params) {
    return this.worker("exec", {
      dbId: this.dbId,
      ...params
    })
  }

  close() {
    return this.worker("close", {
      dbId: this.dbId,
    })
  }
}

export default SqliteDriver;