<script setup>
</script>

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
      <v-btn @click="save" :disabled="disableSave">保存</v-btn>
    </div>
  </div>
  <div class="data-grid">
    <v-data-table :items="dataList">

    </v-data-table>
  </div>
</template>

<script>
import {sqlite3Worker1Promiser} from "@sqlite.org/sqlite-wasm";

const SQLITE3_DB_FILENAME = "vue-sqlite3-wasm.sqlite3"
const SQLITE3_DB = `file:${SQLITE3_DB_FILENAME}?vfs=opfs`

export default {
  computed: {
    disableSave() {
      return this.inputName === ""
          || this.inputAge === ""
          || this.inputGender === ""
    }

  },
  methods: {
    /**
     * サンプルデータ追加
     */
    insertSample() {
      new Promise(async (resolve) => {
        let lastId = 0

        await this.sqlWorker('exec', {
          dbId: this.dbId,
          sql: `SELECT count(*) FROM USER_INFO`,
          callback: (result) => {
            if (result.row) {
              lastId = result.row[0]
            }
          }
        })

        console.log('Insert sample data...');
        for (let i = 0; i < 5; i++) {
          this.sqlWorker('exec', {
            dbId: this.dbId,
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
    reload() {
      new Promise(async (resolve) => {
        const resultList = []
        await this.sqlWorker('exec', {
          dbId: this.dbId,
          sql: `SELECT * FROM USER_INFO`,
          callback: (result) => {
            if (result.row) {
              const entity = {}
              for (const index in result.row) {
                entity[result.columnNames[index]] = result.row[index]
              }
              resultList.push(entity)
            }
            // console.log(result)
          }
        })
        resolve(resultList)
      }).then(result => {
        this.dataList = result;
      })
    },
    /**
     * クリア
     */
    truncateTable() {
      this.sqlWorker('exec', {
        dbId: this.dbId,
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
    importFile(e) {
      const file = this.$refs.fileSelector.files[0]
      const reader = new FileReader()

      reader.addEventListener("load", async () => {
        // OPFSのファイル操作
        const root = await navigator.storage.getDirectory()

        // SQLITE3のファイルに取り込んだファイルデータを流し込む
        const hNewSqliteFile = await root.getFileHandle(SQLITE3_DB_FILENAME, {create: true})
        const accessHandle = await hNewSqliteFile.createWritable()
        await accessHandle.write(reader.result)
        await accessHandle.close()

        // 流し込んだデータでSQLITE3を開きなおす
        await this.sqlWorker("open", { filename: ":memory:" })

        // 画面の再表示
        this.reload()
      })
      reader.readAsArrayBuffer(file)
    },

    /**
     * ファイル出力
     */
    exportFile() {
      this.sqlWorker("export", {
        dbId: this.dbId,
      }).then((response) => {
        const filename = response.result.filename.split("?")[0]
        const blob = new Blob([response.result.byteArray], { type: "application/x-sqlite3" })

        // アンカーを使って，ファイルをダウンロード
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.addEventListener("click", () => {
          setTimeout(() => {
            URL.revokeObjectURL(a.href);
            a.remove();
          }, 500);
        });
        a.click()
      })
    },
    /**
     * 保存
     */
    save() {
      this.sqlWorker('exec', {
        dbId: this.dbId,
        sql: `INSERT INTO USER_INFO(NAME, AGE, GENDER) VALUES (?, ?, ?)`,
        bind: [this.inputName, this.inputAge, this.inputGender]
      }).then(() => {
        this.reload()
      })
    },
  },

  data() {
    return {
      inputRowID: null,
      inputName: "",
      inputAge: "",
      inputGender: "",

      // Sqlite3-wasm
      sqlWorker: null,
      dbId: null,
      dataList: [],
    }
  },

  async mounted() {
    // Sqlite3Wasmのワーカーの生成
    console.log('Loading and initializing SQLite3 module...');
    this.sqlWorker = await new Promise((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        //debug: console.log,
        onready: () => {
          resolve(_promiser);
        },
      });
    });

    console.log('Done initializing. Running demo...');

    // バージョン出力
    this.sqlWorker('config-get', {}).then(response => {
      console.log('Running SQLite3 config:', response);
    })


    // DBファイル読み込み
    this.sqlWorker('open', {
      filename: SQLITE3_DB,
    }).then(response => {
      // 開けたら，IDを保存しておく
      this.dbId = response.dbId;
    }).then(() => {
      // テーブルの初期設定
      console.log('Creating a table...');
      return this.sqlWorker('exec', {
        dbId: this.dbId,
        sql: `CREATE TABLE IF NOT EXISTS USER_INFO(
                  USER_ID INTEGER PRIMARY KEY,
                  NAME TEXT NOT NULL,
                  AGE INTEGER NOT NULL,
                  GENDER TEXT NOT NULL
              )`
      })
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
    this.sqlWorker("close", {dbId: this.dbId})
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
