import {downloadSqlite3Data, SqliteDriver, uploadSqlite3Data} from "@/sqlite3";
import {TodoTaskClient, type TodoTaskEntity} from "@/clients/TodoTaskClient";

/**
 * DBクライアントComposition
 */
function useClient() {
  const driver = new SqliteDriver()
  const todoTaskClient = new TodoTaskClient(driver)

  const initialize = async (filename: string) => {
    await driver.initialize(filename)
    await driver.open()

    await todoTaskClient.initialize()
  }

  const release = () => {
    return driver.close()
  }

  const saveTask = (e: TodoTaskEntity) => {
    if (e.taskId) {
      return todoTaskClient.update(e)
    } else {
      return todoTaskClient.insert(e)
    }
  }

  const updateFinishTask = (taskId: number, isFinished: boolean) => {
    return todoTaskClient.updateFinish(taskId, isFinished)
  }

  const deleteTask = (taskId: number) => {
    return todoTaskClient.delete(taskId)
  }

  const selectAll = () => {
    return todoTaskClient.selectAll()
  }

  const truncateTable = () => {
    return todoTaskClient.truncateTable()
  }

  const uploadFile = (file: File) => {
    return uploadSqlite3Data(driver, file)
  }

  const downloadFile = (filename: string) => {
    return downloadSqlite3Data(driver, filename)
  }

  return {
    // 初期化
    initialize,
    release,

    // DB操作
    saveTask,
    updateFinishTask,
    deleteTask,
    selectAll,
    truncateTable,

    // DBダンプ
    uploadFile,
    downloadFile
  }
}
export {
  useClient
}