<template>
  <div style="display:flex">

    <!-- 各種基本操作 -->
    <div class="manipulation">
      <v-btn @click="reload">再読み込み</v-btn>
      <v-btn @click="truncateTable">テーブルクリア</v-btn>
      <v-btn @click="showInputDialog">ファイル読み込み</v-btn>
      <input ref="fileSelector" type="file" style="display: none;" @change="importFile">
      <v-btn @click="exportFile">ファイル出力</v-btn>
    </div>

    <!-- 入力フォーム -->
    <div class="input-form">
      <div style="display: flex">
        <div style="min-width: 500px">
        <v-text-field label="content" v-model="inputData.content"></v-text-field>
        <v-select
            label="Priority"
            v-model="inputData.priority"
            item-value="value"
            item-title="label"
            :items="priorityItems"
        >
        </v-select>
        <v-text-field label="memo" v-model="inputData.memo"></v-text-field>
        </div>
        <v-date-picker v-model="inputData.limitDate" show-adjacent-months></v-date-picker>
      </div>
      <v-btn @click="clearInput">クリア</v-btn>
      <v-btn @click="save" :disabled="disableSave">保存</v-btn>
      <v-btn @click="duplicate" :disabled="disableDuplicate">複製</v-btn>
    </div>
  </div>

  <!-- タスクのテーブル -->
  <div class="data-grid">
    <v-data-table
        :items="dataList"
        return-object
    >
      <template v-slot:top>
        <div>
          <v-btn @click="remove" :disabled="!inputData.taskId">選択行の削除</v-btn>
        </div>
      </template>

      <template v-slot:item="{item}">
        <tr :class="taskClass(item)" @click="selectRecord(item)">
          <td>{{item.taskId}}</td>
          <td>{{item.content}}</td>
          <td>{{printDate(item.limitDate)}}</td>
          <td>{{printPriorityLabel(item.priority)}}</td>
          <td>{{item.memo}}</td>
          <td>
            <v-btn @click.stop="finish(item.taskId!)" v-if="!item.isFinished">完了</v-btn>
            <v-btn @click.stop="revert(item.taskId!)" v-if="item.isFinished">復帰</v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import {
  SqliteDriver,
  downloadSqlite3Data,
  uploadSqlite3Data
} from "@/sqlite3";

import {
  TodoTaskClient,
  type TodoTaskEntity
} from "@/clients/TodoTaskClient";

const SQLITE3_DB_FILENAME = "todo_task.sqlite3"

const PriorityMaster = [
  { value: 1, label: "低"},
  { value: 2, label: "中"},
  { value: 3, label: "高"},
  { value: 4, label: "最優先"},
]

export default {
  computed: {
    priorityItems () {
      return PriorityMaster
    },
    disableSave() {
      return false
    },
    disableDuplicate() {
      return !this.inputData.taskId
    }
  },
  
  data() {
    const driver = new SqliteDriver()
    const client = new TodoTaskClient(driver)
    return {
      // 入力情報
      inputData: {} as TodoTaskEntity,

      // グリッドデータ
      dataList: [] as TodoTaskEntity[],
      selectedItems: [] as TodoTaskEntity[],

      // Sqlite-WASM ドライバー
      sqliteDriver: driver,
      todoTaskClient: client
    }
  },

  async mounted() {
    // インスタンスの生成
    await this.sqliteDriver.initialize(SQLITE3_DB_FILENAME)

    // DBのオープン
    await this.sqliteDriver.open()

    // テーブルの初期化
    Promise.all([
      this.todoTaskClient.initialize()
    ])
    .then(() => {
      // データ表示
      this.reload()
    }).catch((err) => {
      if (!(err instanceof Error)) {
        err = new Error(err.result.message);
      }
      console.error(err.name, err.message);
    })
  },

  unmounted() {
    this.sqliteDriver.close()
  },

  methods: {
    /**
     * 日付の出力
     * @param date
     */
    printDate (date: Date) {
      return date.toLocaleDateString()
    },

    /**
     * 優先順の出力
     * @param priority
     */
    printPriorityLabel (priority: number) {
      return this.priorityItems.filter(p => p.value === priority)[0].label
    },

    /**
     * 行のクラス指定
     * @param task
     */
    taskClass(task: TodoTaskEntity) {
      if(this.inputData.taskId === task.taskId) {
        return {
          "grid-record__selected": true,
        }
      }
      return {
        "grid-record": true,
        "grid-record__finished": task.isFinished,
      }
    },

    /**
     * 行選択イベント
     * @param task
     */
    selectRecord(task: TodoTaskEntity) {
      if (this.inputData.taskId === task.taskId) {
        this.clearInput()
      } else {
        this.inputData = task
      }
    },

    /**
     * 再読み込み
     */
    async reload() {
      this.todoTaskClient.selectAll().then(resultList => {
        this.dataList = resultList
      })
    },

    /**
     * テーブルクリア
     */
    truncateTable() {
      this.todoTaskClient.truncateTable().then(() => {
        this.reload()
      })
    },

    /**
     * ファイル選択ダイアログ表示
     */
    showInputDialog() {
      (this.$refs.fileSelector as HTMLInputElement).click();
    },

    /**
     * ファイル取り込み
     */
    async importFile() {
      const file = (this.$refs.fileSelector as HTMLInputElement).files![0]

      await uploadSqlite3Data(this.sqliteDriver, file)

      await this.reload()
    },

    /**
     * ファイル出力
     */
    exportFile() {
      downloadSqlite3Data(this.sqliteDriver, SQLITE3_DB_FILENAME)
    },

    /**
     * 入力値のクリア
     */
    clearInput() {
      this.inputData = {} as TodoTaskEntity
    },

    /**
     * 保存
     */
    save() {
      let savePromise
      console.log("save:", this.inputData)
      if (this.inputData.taskId) {
        // UserIDがあるときはデータ更新
        savePromise = this.todoTaskClient.update(
            this.inputData
        )
      } else {
        // UserIDがないときはデータ追加
        savePromise = this.todoTaskClient.insert(
            this.inputData
        )
      }

      savePromise.then(() => {
        this.clearInput()
        this.selectedItems = []
        this.reload()
      })
    },

    /**
     * 複製
     */
    duplicate() {
      this.todoTaskClient.insert(
          this.inputData
      ).then(() => {
        this.clearInput()
        this.selectedItems = []
        this.reload()
      })
    },

    /**
     * 完了処理
     * @param taskId
     */
    finish(taskId: number) {
      this.todoTaskClient.updateFinish(taskId, true).then(() => {
        this.reload()
      })
    },

    /**
     * 復帰処理
     * @param taskId
     */
    revert(taskId: number) {
      this.todoTaskClient.updateFinish(taskId, false).then(() => {
        this.reload()
      })
    },

    /**
     * データの削除
     */
    remove() {
      this.todoTaskClient.delete(this.inputData.taskId!).then(() => {
        this.clearInput()
        this.reload()
      })
    },
  },
}
</script>

<style scoped>
header {
  line-height: 1.5;
}
.input-form {
  padding: 10px;
  min-width: 1000px;
  max-width: 1000px;
}

.manipulation {
  padding: 10px;
  display: flex;
  flex-direction: column;
}
.manipulation> :nth-child(n+2) {
  margin-top: 10px;
}
.grid-record {
  background-color: white;
}
.grid-record__selected {
  background-color: lightpink;
}
.grid-record__finished {
  background-color: whitesmoke;
}
.grid-record:hover {
  background-color: antiquewhite;
}
</style>
