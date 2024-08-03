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
        <v-text-field label="UserID(readonly)" v-model="inputUserID" readonly></v-text-field>
        <v-text-field label="Name" v-model="inputName"></v-text-field>
        <v-text-field label="Age" v-model="inputAge" type="number"></v-text-field>
        <v-select label="Gender" v-model="inputGender" :items="['Male', 'Female', 'Other']">
        </v-select>

      </div>
      <v-btn @click="clearInput">クリア</v-btn>
      <v-btn @click="save" :disabled="disableSave">保存</v-btn>
      <v-btn @click="remove" :disabled="!inputUserID">削除</v-btn>
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

<script lang="ts">
import {
  SqliteDriver,
  downloadSqlite3Data,
  uploadSqlite3Data
} from "@/sqlite3";
import {UserInfoClient} from "@/clients/UserInfoClient";

const SQLITE3_DB_FILENAME = "vue-sqlite3-wasm.sqlite3"


type UserInfoEntity = {
  USER_ID: number,
  NAME: string,
  AGE: number,
  GENDER: string,
}


export default {
  computed: {
    disableSave() {
      return this.inputName === ""
          || this.inputAge === null
          || this.inputGender === ""
    }

  },
  watch: {
    selectedItems() {
      if (this.selectedItems.length > 0) {
        const lastData = this.selectedItems[this.selectedItems.length - 1]
        this.inputUserID = lastData.USER_ID
        this.inputName = lastData.NAME
        this.inputAge = lastData.AGE
        this.inputGender = lastData.GENDER
      } else {
        this.inputUserID = null
        this.inputName = ""
        this.inputAge = null
        this.inputGender = ""
      }
    }
  },

  data() {
    const driver = new SqliteDriver()
    const client = new UserInfoClient(driver)
    return {
      // 入力情報
      inputUserID: null as number | null,
      inputName: "",
      inputAge: null as number | null,
      inputGender: "",


      // グリッドデータ
      dataList: [] as UserInfoEntity[],
      selectedItems: [] as UserInfoEntity[],

      // Sqlite-WASM ドライバー
      sqliteDriver: driver,
      userInfoClient: client
    }
  },

  async mounted() {
    // インスタンスの生成
    await this.sqliteDriver.initialize(SQLITE3_DB_FILENAME)

    // DBのオープン
    await this.sqliteDriver.open()

    // テーブルの初期化
    this.userInfoClient.initialize().then(() => {
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

        const lastId = await this.userInfoClient.getLastUserId()

        for (let i = 0; i < 5; i++) {
          await this.userInfoClient.insert(`User${lastId + (i + 1)}`, 20, 'Other')
        }
        resolve(null)
      }).then(() => {
        this.reload()
      })
    },

    /**
     * 再読み込み
     */
    async reload() {
      this.userInfoClient.selectAll().then(resultList => {
        this.dataList = resultList
      })
    },

    /**
     * テーブルクリア
     */
    truncateTable() {
      this.userInfoClient.truncateTable().then(() => {
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
      this.inputUserID = null
      this.inputName = ""
      this.inputAge = null
      this.inputGender = ""
    },

    /**
     * 保存
     */
    save() {
      if (this.inputUserID === null) {
        // UserIDがないときはデータ追加
        this.userInfoClient.insert(
            this.inputName,
            this.inputAge!,
            this.inputGender
        ).then(() => {
          this.clearInput()
          this.selectedItems = []
          this.reload()
        })
      } else {
        // UserIDがあるときはデータ更新
        this.userInfoClient.update(
            this.inputUserID,
            this.inputName,
            this.inputAge!,
            this.inputGender
        ).then(() => {
          this.clearInput()
          this.selectedItems = []
          this.reload()
        })
      }
    },

    /**
     * データの削除
     */
    remove() {
      this.userInfoClient.delete(this.inputUserID!).then(() => {
        this.reload()
      })
    },

    /**
     * 選択行のデータ削除
     */
    removeSelectedItems() {
      const promiseList = this.selectedItems.map(e => {
        return this.userInfoClient.delete(e.USER_ID)
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
