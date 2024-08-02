<template>
  <div style="display:flex">
    <div class="manipulation">
      <v-btn @click="insertSample">サンプルデータ追加</v-btn>
      <v-btn @click="reload">再読み込み</v-btn>
      <v-btn @click="truncateTable">テーブルクリア</v-btn>
      <v-btn @click="showInputDialog">ファイル読み込み</v-btn>
      <input ref="fileSelector" type="file" style="display: none;" @change="importFile">
      <v-btn @click="exportFile">ファイル出力</v-btn>
    </div>
    <div class="input-form">
      <div>
        <v-text-field label="RowID" v-model="inputRowID" readonly style="display:none"></v-text-field>
        <v-text-field label="Name" v-model="inputName"></v-text-field>
        <v-text-field label="Age" v-model="inputAge"></v-text-field>
        <v-select label="Gender" v-model="inputGender" :items="['Male', 'Female', 'Other']">
        </v-select>

      </div>
      <v-btn @click="clear">クリア</v-btn>
      <v-btn @click="save" :disabled="disableSave">保存</v-btn>
      <v-btn @click="remove" :disabled="!inputRowID">削除</v-btn>
    </div>
  </div>
  <div class="data-grid">
    <v-data-table
        v-model="selectedItems"
        :items="dataList"
        return-object
        show-select
    >
      <template v-slot:top>
        <div>
          <v-btn @click="removeSelectedItems" :disabled="selectedItems.length === 0">選択行の削除</v-btn>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script>
const SQLITE3_DB_FILENAME = "vue-sqlite3-wasm.sqlite3"

import {
  SqliteDriver,
  downloadSqlite3Data,
  uploadSqlite3Data
} from "@/sqlite3/index.js";


export default {
  computed: {
    disableSave() {
      return this.inputName === ""
          || this.inputAge === ""
          || this.inputGender === ""
    }

  },
  watch: {
    selectedItems() {
      if (this.selectedItems.length > 0) {
        const lastData = this.selectedItems[this.selectedItems.length - 1]
        this.inputRowID = lastData.USER_ID
        this.inputName = lastData.NAME
        this.inputAge = lastData.AGE
        this.inputGender = lastData.GENDER
      } else {
        this.inputRowID = null
        this.inputName = ""
        this.inputAge = ""
        this.inputGender = ""
      }
    }
  },

  data() {
    return {
      // 入力情報
      inputRowID: null,
      inputName: "",
      inputAge: "",
      inputGender: "",


      // グリッドデータ
      dataList: [],
      selectedItems: [],

      // Sqlite-WASM ドライバー
      sqliteDriver: null,
    }
  },

  async mounted() {
    // インスタンスの生成
    this.sqliteDriver = await SqliteDriver.build(SQLITE3_DB_FILENAME)

    // DBのオープン
    await this.sqliteDriver.open()

    // テーブルの初期化
    this.sqliteDriver.exec({
      sql: `CREATE TABLE IF NOT EXISTS USER_INFO(
                  USER_ID INTEGER PRIMARY KEY,
                  NAME TEXT NOT NULL,
                  AGE INTEGER NOT NULL,
                  GENDER TEXT NOT NULL
              )`
    }).then(() => {
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
     * サンプルデータ追加
     */
    insertSample() {
      new Promise(async (resolve) => {
        let lastId = 0

        await this.sqliteDriver.exec({
          sql: `SELECT count(*) FROM USER_INFO`,
          callback: (result) => {
            if (result.row) {
              lastId = result.row[0]
            }
          }
        })

        console.log('Insert sample data...');
        for (let i = 0; i < 5; i++) {
          this.sqliteDriver.exec({
            sql: `INSERT INTO USER_INFO(NAME, AGE, GENDER) VALUES (?, ?, ?)`,
            bind: [`User${lastId + (i + 1)}`, 20, 'Other']
          })
        }
        resolve()
      }).then(() => {
        this.reload()
      })
    },
    /**
     * 再読み込み
     */
    async reload() {
      const resultList = []
      await this.sqliteDriver.exec({
        sql: `SELECT * FROM USER_INFO`,
        callback: (result) => {
          if (result.row) {
            const entity = {}
            for (const index in result.row) {
              entity[result.columnNames[index]] = result.row[index]
            }
            resultList.push(entity)
          }
        }
      })
      this.dataList = resultList
    },
    /**
     * クリア
     */
    truncateTable() {
      this.sqliteDriver.exec({
        sql: `delete from USER_INFO`
      }).then(() => {
        this.reload()
      })
    },
    /**
     * ファイル選択ダイアログ表示
     */
    showInputDialog() {
      this.$refs.fileSelector.click();
    },
    /**
     * ファイル取り込み
     */
    async importFile() {
      const file = this.$refs.fileSelector.files[0]

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
     *
     */
    clear() {
      this.inputRowID = null
      this.inputName = ""
      this.inputAge = ""
      this.inputGender = ""
    },
    /**
     * 保存
     */
    save() {
      this.sqliteDriver.exec({
        sql: `INSERT INTO USER_INFO(NAME, AGE, GENDER) VALUES (?, ?, ?)`,
        bind: [this.inputName, this.inputAge, this.inputGender],
      }).then(() => {
        this.clear()
        this.reload()
      })
    },

    remove() {
      this.sqliteDriver.exec({
        sql: `DELETE FROM USER_INFO WHERE USER_ID = ?`,
        bind: [this.inputRowID],
      }).then(() => {
        this.reload()
      })
    },
    removeSelectedItems() {
      const promiseList = this.selectedItems.map(e => {
        return this.sqliteDriver.exec({
          sql: `DELETE FROM USER_INFO WHERE USER_ID = ?`,
          bind: [e.USER_ID],
        })
      })

      Promise.all(promiseList).then(() => {
        this.selectedItems = []
        this.reload()
      })
    }
  },
}
</script>

<style scoped>
header {
  line-height: 1.5;
}
.input-form {
  padding: 10px;
  min-width: 500px;
  max-width: 500px;
}

.manipulation {
  padding: 10px;
  display: flex;
  flex-direction: column;
}
.manipulation> :nth-child(n+2) {
  margin-top: 10px;
}
</style>
