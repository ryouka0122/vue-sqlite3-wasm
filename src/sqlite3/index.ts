import { SqliteDriver } from "@/sqlite3/driver";

/**
 * ファイルのアップロード
 * @param driver {SqliteDriver}
 * @param file {File}
 * @return Promise<void>
 */
function uploadSqlite3Data(driver: SqliteDriver, file: File) {

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      // OPFSのファイル操作（ルートディレクトリに配置していることを前提に処理を行っている）
      const root = await navigator.storage.getDirectory()

      // SQLITE3のファイルに取り込んだファイルデータを流し込む
      const hNewSqliteFile = await root.getFileHandle(
        driver.get_db_file(), {create: true})
      const accessHandle = await hNewSqliteFile.createWritable()
      await accessHandle.write(reader.result!)
      await accessHandle.close()

      // 流し込んだデータでSQLITE3を開きなおす
      driver.open().then(resolve, reject)
    })
    reader.readAsArrayBuffer(file)
  })
}

/**
 * ファイルのダウンロード
 * @param driver
 * @param filename
 */
function downloadSqlite3Data(driver: SqliteDriver, filename: string) {

  return new Promise((resolve) => {
    // exportの実行
    driver.export_data().then((blob: Blob) => {

      // アンカーを使って，ファイルをダウンロード
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.addEventListener("click", () => {
        setTimeout(() => {
          URL.revokeObjectURL(a.href);
          a.remove();

          // 処理が終わったらPromiseで後続の処理に遷移
          resolve(null)
        }, 500);
      });
      a.click()
    })
  })
}

export {
  SqliteDriver,
  uploadSqlite3Data,
  downloadSqlite3Data,
}
