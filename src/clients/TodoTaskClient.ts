import {SqliteDriver} from "@/sqlite3";


type TodoTask = {
  TASK_ID: number,
  CONTENT: string,
  LIMIT_DATE: string,
  PRIORITY: number,
  MEMO: string | null,
  IS_FINISHED: number,
}

type TodoTaskEntity = {
  taskId: number|null,
  content: string,
  limitDate: Date,
  priority: number,
  memo: string | null,
  isFinished: boolean,
}

/**
 * レコードからエンティティへの変換処理
 * @param data
 */
function convertToEntity(data: TodoTask): TodoTaskEntity {
  return {
    taskId: data.TASK_ID,
    content: data.CONTENT,
    limitDate: new Date(data.LIMIT_DATE),
    priority: data.PRIORITY,
    memo: data.MEMO,
    isFinished: data.IS_FINISHED === 1,
  }
}

/**
 * エンティティからレコードへの変換処理
 * @param e
 */
function convertFromEntity(e: TodoTaskEntity): TodoTask {
  return {
    TASK_ID: e.taskId!,
    CONTENT: e.content,
    LIMIT_DATE: e.limitDate.toLocaleString(),
    PRIORITY: e.priority,
    MEMO: e.memo,
    IS_FINISHED: e.isFinished ? 1 : 0,
  }
}

class TodoTaskClient {

  /** SqliteDriver */
  driver: SqliteDriver

  /**
   * コンストラクタ
   * @param driver
   */
  constructor(driver: SqliteDriver) {
    this.driver = driver;
  }

  /**
   * 初期化
   */
  initialize() {
    return this.driver.exec({
      sql: `CREATE TABLE IF NOT EXISTS TODO_TASK(
                TASK_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                CONTENT TEXT NOT NULL,
                LIMIT_DATE TEXT NOT NULL,
                PRIORITY INTEGER NOT NULL,
                MEMO TEXT,
                IS_FINISHED INTEGER NOT NULL
            )`
    })
  }

  /**
   * データ取得
   */
  async selectAll() {
    const resultList = [] as TodoTaskEntity[]
    await this.driver.exec<TodoTask>({
      sql: `SELECT * FROM TODO_TASK ORDER BY IS_FINISHED, LIMIT_DATE, PRIORITY, TASK_ID`,
      callback: (result) => {
        resultList.push(convertToEntity(result.record))
      }
    })
    return resultList
  }

  /**
   * データの登録
   * @param task
   */
  insert(task: TodoTaskEntity) {
    return this.driver.exec({
      sql: `INSERT INTO TODO_TASK(
                CONTENT, LIMIT_DATE, PRIORITY, MEMO, IS_FINISHED
            ) VALUES (?, ?, ?, ?, ?)`,
      bind: [
        task.content,
        task.limitDate.toLocaleString(),
        task.priority,
        task.memo,
        0
      ],
    })
  }

  /**
   * データの更新
   * @param task
   */
  update(task: TodoTaskEntity) {
    const record = convertFromEntity(task)
    return this.driver.exec({
      sql: `UPDATE TODO_TASK SET
                CONTENT = ?,
                LIMIT_DATE = ?,
                PRIORITY = ?,
                MEMO = ?,
                IS_FINISHED = ?
            WHERE TASK_ID = ?`,
      bind: [
        record.CONTENT,
        record.LIMIT_DATE,
        record.PRIORITY,
        record.MEMO,
        record.IS_FINISHED,
        record.TASK_ID
      ],
    })
  }

  /**
   * 完了状態の更新
   * @param taskId
   * @param isFinished
   */
  updateFinish(taskId: number, isFinished: boolean) {
    return this.driver.exec({
      sql: `UPDATE TODO_TASK SET
                IS_FINISHED = ?
            WHERE TASK_ID = ?`,
      bind: [
        isFinished ? 1 : 0,
        taskId,
      ],
    })
  }

  /**
   * データの削除
   * @param taskId
   */
  delete(taskId: number) {
    return this.driver.exec({
      sql: `DELETE FROM TODO_TASK WHERE TASK_ID = ?`,
      bind: [taskId]
    })
  }

  /**
   * テーブルデータ前作所
   */
  truncateTable() {
    return this.driver.exec({
      sql: `DELETE FROM TODO_TASK`
    })
  }

}

export {
  TodoTaskClient,
  type TodoTask,
  type TodoTaskEntity
}