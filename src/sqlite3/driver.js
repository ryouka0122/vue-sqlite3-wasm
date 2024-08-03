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
   * インスタンス生成
   * @param filename {string} OPFS上のファイル名
   * @returns {Promise<SqliteDriver>}
   */
  static async build(filename) {
    const driver = new SqliteDriver(filename);

    // Sqlite3-worker1-promiserの初期化
    driver.worker = await new Promise((resolve) => {
      const p = sqlite3Worker1Promiser({
        //debug: console.log,
        onready: () => {
          resolve(p);
        },
      });
    });

    return driver;
  }

  /**
   * コンストラクタ
   * @param sqlite_db_file {string}
   */
  constructor (sqlite_db_file) {
    this.db_filename = sqlite_db_file
    this.opfs_file_path = `file:${sqlite_db_file}?vfs=opfs`
  }

  /**
   * DBデータの出力
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
   * 設定情報の取得
   * @returns {Promise<*>}
   */
  get_config() {
    return this.worker("config-get", {})
  }

  /**
   * DBのオープン
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

  /**
   * SQLの実行
   * @param params {Object}
   * @returns {Promise<*>}
   */
  exec(params) {
    return this.worker("exec", {
      dbId: this.dbId,
      ...params
    })
  }

  /**
   * DBのクローズ
   * @returns {Promise<*>}
   */
  close() {
    return this.worker("close", {
      dbId: this.dbId,
    })
  }
}

export default SqliteDriver;