<script setup lang="ts">

import {onMounted, onUnmounted, ref} from "vue";
import {useClient} from "./composable/TodoTaskWrapper"
import {SQLITE3_DB_FILENAME} from "@/constants";
import {taskTableComposition} from "@/composable/AppTaskTable";
import {inputDataComposition} from "@/composable/AppInputData";

const {
  initialize,
  release,
  selectAll,
  saveTask,
  deleteTask,
  updateFinishTask,
  truncateTable,
  uploadFile,
  downloadFile
} = useClient()

const {
  inputData,
  priorityItems,
  disableSave,
  disableDuplicate,
  taskClass,
  setInputData,
  clearInput,
  saveInput,
  duplicateRecord
} = inputDataComposition(saveTask)

const {
  dataList,
  printDate,
  printPriorityLabel,
} = taskTableComposition()

// ============================================================================
//
// コンポーネントの定義
//

const fileSelector = ref<HTMLInputElement>()

/**
 * 初期化
 */
onMounted(() => {
  // DBの初期化
  initialize(SQLITE3_DB_FILENAME).then(() => {
    // データ表示
    reload()
  }).catch((err) => {
    if (!(err instanceof Error)) {
      err = new Error(err.result.message);
    }
    console.error(err.name, err.message);
  })

})

/**
 * 後片付け
 */
onUnmounted(() => {
  release()
})


// ================================================================================================
// ボタンイベント

/**
 * 再読み込みボタン
 */
function reload() {
  selectAll().then(resultList => {
    dataList.value = resultList
  })
}

/**
 * テーブルクリアボタン
 */
function clearTable() {
  truncateTable().then(() => {
    clearInput()
    reload()
  })
}

/**
 * ファイル読み込みボタン
 */
function showInputDialog() {
  fileSelector.value?.click();
}

/**
 * 取り込み処理（ファイル選択ダイアログ選択後イベント）
 */
function importFile() {
  const file = fileSelector.value?.files![0]
  if (file) {
    uploadFile(file).then(() => {
      reload()
    })
  }
}

/**
 * ファイル出力ボタン
 */
async function exportFile() {
  await downloadFile(SQLITE3_DB_FILENAME)
}

/**
 * クリアボタン
 */
function clear() {
  clearInput()
}

/**
 * 保存ボタン
 */
function save() {
  saveInput().then(() => {
    reload()
  })
}

/**
 * 複製ボタン
 */
function duplicate() {
  duplicateRecord().then(() => {
    reload()
  })
}

/**
 * 完了ボタン
 * @param taskId
 */
function finish(taskId: number) {
  updateFinishTask(taskId, true).then(() => {
    reload()
  })
}

/**
 * 復帰ボタン
 * @param taskId
 */
function revert(taskId: number) {
  updateFinishTask(taskId, false).then(() => {
    reload()
  })
}

/**
 * 削除ボタン
 * @param taskId
 */
function remove(taskId: number) {
  deleteTask(taskId).then(() => {
    reload()
  })
}
</script>

<template>
  <div style="display:flex">

    <!-- 各種基本操作 -->
    <div class="manipulation">
      <v-btn @click="reload">再読み込み</v-btn>
      <v-btn @click="clearTable">テーブルクリア</v-btn>
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
      <v-btn @click="clear">クリア</v-btn>
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
        </div>
      </template>

      <template v-slot:item="{item}">
        <tr :class="taskClass(item)" @click="setInputData(item)">
          <td>{{item.taskId}}</td>
          <td>{{item.content}}</td>
          <td>{{printDate(item.limitDate)}}</td>
          <td>{{printPriorityLabel(item.priority)}}</td>
          <td>{{item.memo}}</td>
          <td>
            <v-btn @click.stop="finish(item.taskId!)" v-if="!item.isFinished">完了</v-btn>
            <v-btn @click.stop="revert(item.taskId!)" v-if="item.isFinished">復帰</v-btn>
          </td>
          <td>
            <v-btn @click="remove(item.taskId!)">削除</v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

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
