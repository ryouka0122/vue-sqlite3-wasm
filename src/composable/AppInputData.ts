import type {TodoTaskEntity} from "@/clients/TodoTaskClient";
import {computed, ref} from "vue";
import {PriorityMaster} from "@/constants";

/**
 * 入力情報Composition
 */
function inputDataComposition(saveFunc: (e: TodoTaskEntity) => Promise<void>) {

  const getInitData = (): TodoTaskEntity => {
    return {
      taskId: null,
      content: "",
      limitDate: new Date(),
      priority: 2,
      memo: null,
      isFinished: false,
    }
  }

  let inputData = ref(getInitData())

  const priorityItems = computed(() => {
    return PriorityMaster
  })

  const disableSave = computed(() => {
    return (inputData.value.content.length === 0)
      || !(inputData.value.limitDate)
      || !(inputData.value.priority)
  })

  const disableDuplicate = computed(() => {
    return !inputData.value.taskId
  })

  /**
   * 行のクラス指定
   * @param task
   */
  const taskClass = (task: TodoTaskEntity) => {
    if(inputData.value.taskId === task.taskId) {
      return {
        "grid-record__selected": true,
      }
    }
    return {
      "grid-record": true,
      "grid-record__finished": task.isFinished,
    }
  }

  /**
   * 行選択イベント
   * @param task
   */
  const setInputData = (task: TodoTaskEntity) => {
    if (inputData.value.taskId === task.taskId) {
      clearInput()
    } else {
      inputData.value = task
    }
  }

  /**
   * 入力値のクリア
   */
  const clearInput = () => {
    inputData.value = getInitData()
  }

  /**
   * 保存処理
   */
  const saveInput = async () => {
    return saveFunc(inputData.value).then(() => {
      clearInput()
    })
  }

  /**
   * 複製処理
   */
  const duplicateRecord = async () => {
    saveFunc({
      ...inputData.value,
      taskId: null
    }).then(() => {
      clearInput()
    })
  }

  return {
    inputData,
    priorityItems,
    disableSave,
    disableDuplicate,
    taskClass,
    setInputData,
    clearInput,
    saveInput,
    duplicateRecord
  }
}

export {
  inputDataComposition
}