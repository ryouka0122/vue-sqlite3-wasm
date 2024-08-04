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
   * 初期化
   * @param sqlite_db_file {string}
   */
  async initialize (sqlite_db_file) {
    // Sqlite3-worker1-promiserの初期化
    this.worker = await new Promise((resolve) => {
      const p = sqlite3Worker1Promiser({
        //debug: console.log,
        onready: () => {
          resolve(p);
        },
      });
    });

    this.db_filename = sqlite_db_file
    this.opfs_file_path = `file:${sqlite_db_file}?vfs=opfs`
  }

  get_db_file() {
    return this.db_filename
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
    const convertRow = (result) => {
      if (!params.callback) {
        return
      }

      if (!result.row) {
        return
      }

      const record = {}
      for (const index in result.row) {
        record[result.columnNames[index]] = result.row[index]
      }

      params.callback({
        record
      })
    }

    return this.worker("exec", {
      dbId: this.dbId,
      ...params,
      callback: convertRow
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

export {
  SqliteDriver
};